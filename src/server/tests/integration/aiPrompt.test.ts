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
const { FakeIdentityStore, FakeSettingsSource, FakeRequestLogStore } = await import('../helpers/fakes.ts');

const identityStore = new FakeIdentityStore({ 'no-ai': { roles: ['student'], facultyId: 'F1', permissions: [] } });
const settingsSource = new FakeSettingsSource();
const logStore = new FakeRequestLogStore();

const token = jwt.sign({ sub: 'student-1' }, 'integration-test-secret');
const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

let behavior: LLMClient['generate'];
let calls: { turns: any[] }[] = [];
const fake: LLMClient = { generate: (turns, system) => { calls.push({ turns }); return behavior(turns, system); } };

let server: Server, base: string;
const realError = console.error;

before(async () => {
	console.error = () => {};          // keep expected failure logs out of the test output
	server = createApp({ llmClient: fake, identityStore, settingsSource, requestLogStore: logStore, quiet: true }).listen(0);
	await new Promise(r => server.once('listening', r));
	base = `http://localhost:${(server.address() as AddressInfo).port}`;
});
after(() => { console.error = realError; server.close(); });

function post(body: unknown, headers: Record<string, string> = auth, path = '/api/ai/prompt') {
	return fetch(`${base}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
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

// ---- specs/003 Foundational ----
// a fresh user, so the per-user rate limit used up by the tests above does not interfere
const auth003 = { Authorization: `Bearer ${jwt.sign({ sub: 'student-003' }, 'integration-test-secret')}`, 'Content-Type': 'application/json' };

test('003: /api/ai/chat answers like /api/ai/prompt and returns a request_id', async () => {
	reset();
	const res = await post({ message: 'How do I earn training points?' }, auth003, '/api/ai/chat');
	const json: any = await res.json();
	assert.equal(res.status, 200);
	assert.equal(json.payload.data.reply, 'OK answer');
	assert.match(json.payload.data.request_id, /^[0-9a-f-]{36}$/);
});

test('003: every answered question writes one usage row with tokens and no content', async () => {
	reset(async () => ({ text: 'answer', blocked: false, usage: { inputTokens: 120, outputTokens: 30 }, model: 'gemini-2.5-flash' }));
	logStore.rows = [];
	const res = await post({ message: 'my secret question text' }, auth003, '/api/ai/chat');
	const json: any = await res.json();
	assert.equal(logStore.rows.length, 1);
	const row = logStore.rows[0];
	assert.equal(row.requestId, json.payload.data.request_id);
	assert.equal(row.userId, 'student-003');
	assert.equal(row.role, 'student');
	assert.equal(row.facultyId, 'F1');
	assert.equal(row.outcome, 'answered');
	assert.equal(row.inputTokens, 120);
	assert.equal(row.outputTokens, 30);
	assert.equal(row.units, 150);
	assert.ok(!JSON.stringify(row).includes('my secret question text'));
});

test('003: a user without the ai.chat permission gets 403 and never reaches the AI', async () => {
	reset();
	const noAi = jwt.sign({ sub: 'no-ai' }, 'integration-test-secret');
	const res = await post({ message: 'hi' }, { Authorization: `Bearer ${noAi}`, 'Content-Type': 'application/json' }, '/api/ai/chat');
	assert.equal(res.status, 403);
	assert.equal(calls.length, 0);
});

test('003: a token without a subject gets 401', async () => {
	reset();
	const noSub = jwt.sign({ role: 'x' }, 'integration-test-secret');
	const res = await post({ message: 'hi' }, { Authorization: `Bearer ${noSub}`, 'Content-Type': 'application/json' }, '/api/ai/chat');
	assert.equal(res.status, 401);
});

test('003: identity lookup failure -> 503, not a crash', async () => {
	reset();
	identityStore.fail = true;
	try {
		const res = await post({ message: 'hi' }, auth003, '/api/ai/chat');
		assert.equal(res.status, 503);
		assert.equal(calls.length, 0);
	} finally {
		identityStore.fail = false;
	}
});
