import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AIGateway } from '../../../src/ai/AIGateway.ts';
import { AISettings } from '../../../src/ai/settings/AISettings.ts';
import { UsageLogger } from '../../../src/ai/logging/UsageLogger.ts';
import { LLMError } from '../../../src/clients/LLMClient.ts';
import type { LLMClient } from '../../../src/clients/LLMClient.ts';
import { DISABLED_REPLY, BLOCKED_REPLY, PROMPT_VERSION } from '../../../src/ai/prompt/systemPrompt.ts';
import type { AIIdentity } from '../../../src/types/AIIdentity.ts';
import { FakeSettingsSource, FakeRequestLogStore, captureErrors } from '../../helpers/fakes.ts';

const student: AIIdentity = { userId: 'u1', roles: ['student'], facultyId: 'F1' };
const ask = { message: 'How do I earn points?', history: [] };

function setup(llm: LLMClient, values: Record<string, string> = {}) {
	const source = new FakeSettingsSource(values);
	const store = new FakeRequestLogStore();
	let calls = 0;
	const counting: LLMClient = { generate: (t, s) => { calls++; return llm.generate(t, s); } };
	const gateway = new AIGateway({
		llm: counting,
		settings: new AISettings(source, { ttlMs: 0 }),
		logger: new UsageLogger(store),
		newRequestId: () => 'req-1'
	});
	return { gateway, source, store, calls: () => calls };
}

const ok: LLMClient = { async generate() { return { text: 'Join activities.', blocked: false, usage: { inputTokens: 10, outputTokens: 5 }, model: 'm' }; } };

test('answers and logs one row with role, faculty, tokens, prompt version', async () => {
	const { gateway, store } = setup(ok);
	const r = await gateway.chat(student, ask);
	assert.deepEqual(r, { statusCode: 200, requestId: 'req-1', outcome: 'answered', blocked: false, reply: 'Join activities.' });
	assert.equal(store.rows.length, 1);
	const row = store.rows[0];
	assert.equal(row.outcome, 'answered');
	assert.equal(row.role, 'student');
	assert.equal(row.facultyId, 'F1');
	assert.equal(row.units, 15);
	assert.equal(row.model, 'm');
	assert.equal(row.promptVersion, PROMPT_VERSION);
});

test('kill switch: no model call, fixed reply, outcome disabled', async () => {
	const { gateway, store, calls } = setup(ok, { 'ai.enabled': 'false' });
	const r = await gateway.chat(student, ask);
	assert.equal(r.statusCode, 200);
	assert.equal(r.blocked, true);
	assert.equal(r.reply, DISABLED_REPLY);
	assert.equal(calls(), 0);
	assert.equal(store.rows[0].outcome, 'disabled');
});

test('settings unreadable: refuse with 503 and no model call (fail safe)', async () => {
	const { gateway, source, store, calls } = setup(ok);
	source.fail = true;
	const { result } = await captureErrors(() => gateway.chat(student, ask));
	assert.equal(result.statusCode, 503);
	assert.equal(calls(), 0);
	assert.equal(store.rows[0].outcome, 'error');
	assert.equal(store.rows[0].blockReason, 'settings_unavailable');
});

test('provider safety block: fixed refusal, outcome blocked_output, charged at least min units', async () => {
	const { gateway, store } = setup({ async generate() { return { text: '', blocked: true }; } }, { 'ai.limit.min_units': '500' });
	const r = await gateway.chat(student, ask);
	assert.equal(r.reply, BLOCKED_REPLY);
	assert.equal(store.rows[0].outcome, 'blocked_output');
	assert.equal(store.rows[0].units, 500);
});

test('model failure: 503, Retry-After only for quota, logged without the message', async () => {
	for (const kind of ['timeout', 'quota'] as const) {
		const { gateway, store } = setup({ async generate() { throw new LLMError(kind, 'detail'); } });
		const { result, logs } = await captureErrors(() => gateway.chat(student, { message: 'private text', history: [] }));
		assert.equal(result.statusCode, 503);
		assert.equal(result.retryAfterSeconds, kind === 'quota' ? 30 : undefined);
		assert.equal(store.rows[0].blockReason, `llm_${kind}`);
		assert.ok(logs.every(l => !l.includes('private text')));
	}
});

test('uses the most privileged role for logging', async () => {
	const { gateway, store } = setup(ok);
	await gateway.chat({ userId: 'm1', roles: ['student', 'manager'], facultyId: null }, ask);
	assert.equal(store.rows[0].role, 'manager');
});
