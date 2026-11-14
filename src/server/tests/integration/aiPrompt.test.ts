import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { LLMClient } from '../../src/clients/LLMClient.ts';
import { LLMError } from '../../src/clients/LLMClient.ts';

// must be set before config.ts is loaded (dynamic imports below)
process.env.JWT_SECRET = 'integration-test-secret';
const jwt = (await import('jsonwebtoken')).default;
const { createApp } = await import('../../src/app.ts');

const token = jwt.sign({ sub: 'student-1' }, 'integration-test-secret');
const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

let behavior: LLMClient['generate'];
let calls: { turns: any[] }[] = [];
const fake: LLMClient = { generate: (turns, system) => { calls.push({ turns }); return behavior(turns, system); } };

let server: Server, base: string;
const realError = console.error;

before(async () => {
	console.error = () => {};          // keep expected failure logs out of the test output
	server = createApp({ llmClient: fake, quiet: true }).listen(0);
	await new Promise(r => server.once('listening', r));
	base = `http://localhost:${(server.address() as AddressInfo).port}`;
});
after(() => { console.error = realError; server.close(); });

function post(body: unknown, headers: Record<string, string> = auth) {
	return fetch(`${base}/api/ai/prompt`, { method: 'POST', headers, body: JSON.stringify(body) });
}
function reset(b: LLMClient['generate'] = async () => ({ text: 'OK answer', blocked: false })) { behavior = b; calls = []; }

test('US1: a logged-in student gets an answer', async () => {
	reset();
	const res = await post({ message: 'How do I earn training points?' });
	const json: any = await res.json();
	assert.equal(res.status, 200);
	assert.equal(json.success, true);
	assert.equal(json.payload.data.reply, 'OK answer');
	assert.equal(json.payload.data.blocked, false);
});

test('US2: earlier turns reach the AI in order, new message last', async () => {
	reset();
	await post({ message: 'second one?', history: [{ role: 'user', text: 'clubs?' }, { role: 'assistant', text: 'two' }] });
	assert.deepEqual(calls[0].turns.map(t => t.text), ['clubs?', 'two', 'second one?']);
});

test('US3: invalid bodies are rejected with 400 and never reach the AI', async () => {
	reset();
	for (const body of [{}, { message: '  ' }, { message: 'a'.repeat(2001) }, { message: 'x', history: [{ role: 'bot', text: 'y' }] }]) {
		const res = await post(body);
		const json: any = await res.json();
		assert.equal(res.status, 400);
		assert.ok(Array.isArray(json.payload.data.details) && json.payload.data.details.length > 0);
	}
	assert.equal(calls.length, 0);
});

test('US3: no token / bad token -> 401', async () => {
	reset();
	assert.equal((await post({ message: 'hi' }, { 'Content-Type': 'application/json' })).status, 401);
	assert.equal((await post({ message: 'hi' }, { Authorization: 'Bearer nonsense', 'Content-Type': 'application/json' })).status, 401);
	assert.equal(calls.length, 0);
});

test('US3: wrong method -> 405 with Allow; wrong content type -> 415', async () => {
	reset();
	const get = await fetch(`${base}/api/ai/prompt`, { headers: auth });
	assert.equal(get.status, 405);
	assert.equal(get.headers.get('allow'), 'POST');
	const text = await fetch(`${base}/api/ai/prompt`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'text/plain' }, body: 'hi' });
	assert.equal(text.status, 415);
});

test('US3: AI failure -> 503 with a generic message; quota adds Retry-After; server still works', async () => {
	reset(async () => { throw new LLMError('unavailable', 'Gemini returned HTTP 500'); });
	const res = await post({ message: 'hi' });
	const text = await res.text();
	assert.equal(res.status, 503);
	assert.ok(text.includes('temporarily unavailable'));
	assert.ok(!text.includes('Gemini'));

	reset(async () => { throw new LLMError('quota', 'HTTP 429'); });
	const quota = await post({ message: 'hi' });
	assert.equal(quota.status, 503);
	assert.equal(quota.headers.get('retry-after'), '30');

	const root = await fetch(`${base}/`);
	assert.equal(root.status, 200);
});

test('US3: safety block -> 200 with blocked true', async () => {
	reset(async () => ({ text: '', blocked: true }));
	const json: any = await (await post({ message: 'bad' })).json();
	assert.equal(json.payload.data.blocked, true);
	assert.ok(json.payload.data.reply.includes("can't help"));
});

test('US3: the 11th request in a minute -> 429 with Retry-After (limit is per user)', async () => {
	reset();
	// this user has not used the endpoint yet
	const other = jwt.sign({ sub: 'student-rate' }, 'integration-test-secret');
	const h = { Authorization: `Bearer ${other}`, 'Content-Type': 'application/json' };
	for (let i = 0; i < 10; i++) assert.equal((await post({ message: 'hi' }, h)).status, 200);
	const res = await post({ message: 'hi' }, h);
	assert.equal(res.status, 429);
	assert.ok(Number(res.headers.get('retry-after')) >= 1);
	// another student is not affected
	assert.equal((await post({ message: 'hi' })).status, 200);
});
