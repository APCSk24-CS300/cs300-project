import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AISettings, parseSettings } from '../../../src/ai/settings/AISettings.ts';
import { FakeSettingsSource } from '../../helpers/fakes.ts';

test('parses typed values and falls back to defaults for missing or invalid rows', () => {
	const s = parseSettings({
		'ai.enabled': 'true', 'ai.monthly_budget_usd': '12.5', 'ai.limit.5h.student': '1000',
		'ai.limit.week.student': 'lots', 'ai.limit.min_units': '-3',
		'ai.price.m1': '{"in_per_1m": 0.3, "out_per_1m": 2.5}', 'ai.price.bad': 'not json'
	});
	assert.equal(s.enabled, true);
	assert.equal(s.monthlyBudgetUsd, 12.5);
	assert.equal(s.limit5h('student'), 1000);
	assert.equal(s.limitWeek('student'), 200_000);   // invalid -> default
	assert.equal(s.minUnits, 500);                    // negative -> default
	assert.equal(s.limit5h('manager'), 80_000);       // missing -> role default
	assert.equal(s.limit5h('unknown'), 40_000);       // unknown role -> student default
	assert.deepEqual(s.price('m1'), { inPer1m: 0.3, outPer1m: 2.5 });
	assert.equal(s.price('bad'), null);
	assert.equal(s.price('missing'), null);
});

test('only the exact text "false" switches the assistant off', () => {
	assert.equal(parseSettings({ 'ai.enabled': 'false' }).enabled, false);
	assert.equal(parseSettings({ 'ai.enabled': ' FALSE ' }).enabled, false);
	assert.equal(parseSettings({ 'ai.enabled': 'flase' }).enabled, true);
	assert.equal(parseSettings({}).enabled, true);
});

test('caches for ttlMs, then reloads (kill switch takes effect within 10 s)', async () => {
	let now = 0;
	const source = new FakeSettingsSource();
	const settings = new AISettings(source, { ttlMs: 10_000, now: () => now });
	assert.equal((await settings.snapshot()).enabled, true);
	source.values['ai.enabled'] = 'false';
	now = 9_999;
	assert.equal((await settings.snapshot()).enabled, true);
	now = 10_000;
	assert.equal((await settings.snapshot()).enabled, false);
	assert.equal(source.loads, 2);
});

test('reuses the last snapshot when the source fails, throws if there was never one', async () => {
	let now = 0;
	const source = new FakeSettingsSource({ 'ai.monthly_budget_usd': '7' });
	const settings = new AISettings(source, { ttlMs: 1, now: () => now });
	await settings.snapshot();
	source.fail = true;
	now = 100;
	assert.equal((await settings.snapshot()).monthlyBudgetUsd, 7);

	const fresh = new AISettings(source);
	await assert.rejects(fresh.snapshot());
});
