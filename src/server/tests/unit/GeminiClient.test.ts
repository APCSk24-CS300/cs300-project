import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GeminiClient } from '../../src/clients/GeminiClient.ts';
import { LLMError } from '../../src/clients/LLMClient.ts';

const KEY = 'AIzaSECRET-TEST-KEY';
const turns = [
	{ role: 'user' as const, text: 'Which clubs?' },
	{ role: 'assistant' as const, text: 'Two clubs.' },
	{ role: 'user' as const, text: 'Tell me about the second' }
];

function jsonResponse(status: number, body: unknown): Response {
	return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function client(fetchFn: typeof fetch, apiKey: string | undefined = KEY, timeoutMs = 1000) {
	return new GeminiClient({ apiKey, model: 'test-model', timeoutMs, fetchFn });
}

async function kindOf(p: Promise<unknown>): Promise<{ kind: string, message: string }> {
	try { await p; } catch (e) {
		assert.ok(e instanceof LLMError, 'must throw LLMError');
		return { kind: e.kind, message: e.message };
	}
	assert.fail('expected an LLMError');
}

test('sends system instruction, mapped roles in order, key in header (not URL)', async () => {
	let url = '', init: any;
	const c = client(async (u, i) => {
		url = String(u); init = i;
		return jsonResponse(200, { candidates: [{ content: { parts: [{ text: 'The second club is...' }] } }] });
	});
	const result = await c.generate(turns, 'SYSTEM');

	assert.deepEqual(result, { text: 'The second club is...', blocked: false });
	assert.ok(url.endsWith('/models/test-model:generateContent'));
	assert.ok(!url.includes(KEY));
	assert.equal(init.headers['x-goog-api-key'], KEY);
	const body = JSON.parse(init.body);
	assert.equal(body.systemInstruction.parts[0].text, 'SYSTEM');
	assert.deepEqual(body.contents.map((c: any) => c.role), ['user', 'model', 'user']);
	assert.equal(body.contents[2].parts[0].text, 'Tell me about the second');
});

test('joins several text parts', async () => {
	const c = client(async () => jsonResponse(200, { candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }] }));
	assert.equal((await c.generate(turns, 'S')).text, 'ab');
});

test('missing key -> not_configured, without calling fetch', async () => {
	let called = false;
	const c = client(async () => { called = true; return jsonResponse(200, {}); }, '');
	assert.equal((await kindOf(c.generate(turns, 'S'))).kind, 'not_configured');
	assert.equal(called, false);
});

test('maps HTTP statuses', async () => {
	const cases: [number, string][] = [[429, 'quota'], [500, 'unavailable'], [503, 'unavailable'], [400, 'config'], [401, 'config'], [403, 'config'], [404, 'config']];
	for (const [status, kind] of cases) {
		const c = client(async () => jsonResponse(status, { error: { message: `secret detail ${KEY}` } }));
		const err = await kindOf(c.generate(turns, 'S'));
		assert.equal(err.kind, kind, `status ${status}`);
		assert.ok(!err.message.includes(KEY) && !err.message.includes('secret detail'));
	}
});

test('network failure -> unavailable', async () => {
	const c = client(async () => { throw new TypeError('fetch failed'); });
	assert.equal((await kindOf(c.generate(turns, 'S'))).kind, 'unavailable');
});

test('no answer in time -> timeout', async () => {
	const c = client((_u, init) => new Promise((_res, rej) => {
		(init as any).signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' })));
	}), KEY, 30);
	assert.equal((await kindOf(c.generate(turns, 'S'))).kind, 'timeout');
});

test('unreadable or empty answers -> bad_response', async () => {
	assert.equal((await kindOf(client(async () => new Response('not json', { status: 200 })).generate(turns, 'S'))).kind, 'bad_response');
	assert.equal((await kindOf(client(async () => jsonResponse(200, {})).generate(turns, 'S'))).kind, 'bad_response');
	assert.equal((await kindOf(client(async () => jsonResponse(200, { candidates: [{ content: { parts: [{ text: '  ' }] } }] })).generate(turns, 'S'))).kind, 'bad_response');
});

test('safety blocks -> blocked result, not an error', async () => {
	const a = client(async () => jsonResponse(200, { promptFeedback: { blockReason: 'SAFETY' } }));
	assert.deepEqual(await a.generate(turns, 'S'), { text: '', blocked: true });
	const b = client(async () => jsonResponse(200, { candidates: [{ finishReason: 'SAFETY' }] }));
	assert.deepEqual(await b.generate(turns, 'S'), { text: '', blocked: true });
});
