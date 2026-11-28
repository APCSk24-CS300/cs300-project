import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AIService } from '../../src/services/AIService.ts';
import { LLMError } from '../../src/clients/LLMClient.ts';
import type { LLMClient } from '../../src/clients/LLMClient.ts';
import { BLOCKED_REPLY } from '../../src/services/aiSystemPrompt.ts';
import { AIGateway } from '../../src/ai/AIGateway.ts';
import { AISettings } from '../../src/ai/settings/AISettings.ts';
import { UsageLogger } from '../../src/ai/logging/UsageLogger.ts';
import type { AIIdentity } from '../../src/types/AIIdentity.ts';
import { FakeSettingsSource, FakeRequestLogStore } from '../helpers/fakes.ts';

function service(llm: LLMClient): AIService {
	return new AIService(new AIGateway({
		llm,
		settings: new AISettings(new FakeSettingsSource()),
		logger: new UsageLogger(new FakeRequestLogStore()),
		newRequestId: () => 'req-1'
	}));
}
const who = (userId: string): AIIdentity => ({ userId, roles: ['student'], facultyId: 'F1' });

function silence<T>(fn: () => Promise<T>): Promise<{ result: T, logs: string[] }> {
	const logs: string[] = [];
	const original = console.error;
	console.error = (...a: unknown[]) => { logs.push(a.join(' ')); };
	return fn().then(result => ({ result, logs })).finally(() => { console.error = original; });
}

test('returns the answer as a 200 and sends history + new message to the client', async () => {
	let seen: any;
	const llm: LLMClient = { async generate(turns, system) { seen = { turns, system }; return { text: 'Hi!', blocked: false }; } };
	const { response } = await service(llm).prompt(
		{ message: 'second one?', history: [{ role: 'user', text: 'clubs?' }, { role: 'assistant', text: 'two' }] }, who('u1'));

	assert.equal(response.statusCode, 200);
	assert.equal(response.success, true);
	assert.deepEqual(response.payload.data, { reply: 'Hi!', blocked: false, request_id: 'req-1' });
	assert.deepEqual(seen.turns.map((t: any) => t.text), ['clubs?', 'two', 'second one?']);
	assert.deepEqual(seen.turns.map((t: any) => t.role), ['user', 'assistant', 'user']);
	assert.ok(seen.system.length > 0);
});

test('safety block -> 200 with the fixed refusal', async () => {
	const llm: LLMClient = { async generate() { return { text: '', blocked: true }; } };
	const { response } = await service(llm).prompt({ message: 'x', history: [] }, who('u1'));
	assert.equal(response.statusCode, 200);
	assert.deepEqual(response.payload.data, { reply: BLOCKED_REPLY, blocked: true, request_id: 'req-1' });
});

test('every LLM failure -> generic 503; quota adds Retry-After; log has user + kind, never the message', async () => {
	const kinds = ['not_configured', 'unavailable', 'timeout', 'quota', 'config', 'bad_response'] as const;
	for (const kind of kinds) {
		const llm: LLMClient = { async generate() { throw new LLMError(kind, `detail for ${kind}`); } };
		const { result, logs } = await silence(() => service(llm).prompt({ message: 'my private question', history: [] }, who('user-7')));

		assert.equal(result.response.statusCode, 503, kind);
		assert.equal(result.response.success, false);
		assert.equal(result.response.payload.message, 'AI assistant is temporarily unavailable, please try again later');
		assert.equal(result.retryAfterSeconds, kind === 'quota' ? 30 : undefined);
		assert.equal(logs.length, 1);
		assert.ok(logs[0].includes('user=user-7') && logs[0].includes(`kind=${kind}`));
		assert.ok(!logs[0].includes('my private question'));
	}
});

test('an unexpected error also becomes a 503 and does not throw', async () => {
	const llm: LLMClient = { async generate() { throw new Error('boom'); } };
	const { result } = await silence(() => service(llm).prompt({ message: 'x', history: [] }, who('u')));
	assert.equal(result.response.statusCode, 503);
});
