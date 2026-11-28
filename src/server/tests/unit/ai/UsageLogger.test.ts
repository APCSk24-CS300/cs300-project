import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UsageLogger, estimateCostUsd } from '../../../src/ai/logging/UsageLogger.ts';
import type { UsageEntry } from '../../../src/ai/logging/UsageLogger.ts';
import { parseSettings } from '../../../src/ai/settings/AISettings.ts';
import { FakeRequestLogStore, captureErrors } from '../../helpers/fakes.ts';

const settings = parseSettings({ 'ai.price.m1': '{"in_per_1m": 0.30, "out_per_1m": 2.50}' });
const entry: UsageEntry = {
	requestId: 'r1', userId: 'u1', role: 'student', facultyId: 'F1', topic: 'unclassified', outcome: 'answered',
	model: 'm1', promptVersion: 'v1', inputTokens: 1000, outputTokens: 200, classifierTokens: 0, embeddingTokens: 0,
	units: 1200, latencyMs: 50, toolRounds: 0, sourceCount: 0
};

test('estimates cost from the model price, 0 without a price', () => {
	assert.equal(estimateCostUsd(settings, 'm1', 1000, 200), 0.0008);   // 0.0003 + 0.0005
	assert.equal(estimateCostUsd(settings, 'other', 1000, 200), 0);
	assert.equal(estimateCostUsd(undefined, 'm1', 1000, 200), 0);
});

test('writes one row with the estimated cost', async () => {
	const store = new FakeRequestLogStore();
	await new UsageLogger(store).log(entry, settings);
	assert.equal(store.rows.length, 1);
	assert.equal(store.rows[0].costUsd, 0.0008);
	assert.equal(store.rows[0].requestId, 'r1');
});

test('a store failure never throws, is logged without details, and is remembered', async () => {
	const store = new FakeRequestLogStore();
	store.fail = true;
	const logger = new UsageLogger(store);
	const { logs } = await captureErrors(() => logger.log(entry, settings));
	assert.equal(logs.length, 1);
	assert.ok(logs[0].includes('request=r1') && logs[0].includes('kind=usage_log_failed'));
	assert.ok(logger.lastFailureAt instanceof Date);
});
