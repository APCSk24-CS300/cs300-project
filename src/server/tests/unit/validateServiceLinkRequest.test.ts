import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	isSafeServiceUrl, parseIfMatch, parseServiceId, validateCreateServiceLink, validateUpdateServiceLink
} from '../../src/helper/validateServiceLinkRequest.ts';

const codes = (r: ReturnType<typeof validateCreateServiceLink>) => r.ok ? [] : r.errors.map((e) => `${e.field}:${e.code}`);

test('accepts a minimal valid link and trims it', () => {
	const r = validateCreateServiceLink({ name: '  Moodle ', url: ' https://moodle.hcmus.edu.vn/ ' });
	assert.deepEqual(r, { ok: true, value: { name: 'Moodle', url: 'https://moodle.hcmus.edu.vn/' }, reason: undefined });
});

test('accepts every optional field', () => {
	const r = validateCreateServiceLink({ name: 'Lib', url: 'http://lib.example.edu', description: ' Books ', displayOrder: 0, isActive: false, reason: ' setup ' });
	assert.ok(r.ok);
	assert.deepEqual(r.value, { name: 'Lib', url: 'http://lib.example.edu', description: 'Books', displayOrder: 0, isActive: false });
	assert.equal(r.reason, 'setup');
});

test('empty description becomes null', () => {
	const r = validateCreateServiceLink({ name: 'A', url: 'https://a.edu', description: '   ' });
	assert.ok(r.ok);
	assert.equal(r.value.description, null);
});

test('rejects unsafe or malformed URLs', () => {
	for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'ftp://files.edu', 'moodle.hcmus.edu.vn',
		'https://user:pass@host.edu', 'https://exa mple.edu', `https://a.edu/${'x'.repeat(2048)}`, 'https://', 'mailto:a@b.c']) {
		assert.equal(isSafeServiceUrl(url), false, url);
	}
	assert.equal(isSafeServiceUrl('https://portal.hcmus.edu.vn/path?q=1#x'), true);
});

test('reports every problem at once', () => {
	const r = validateCreateServiceLink({ name: ' ', url: 'javascript:alert(1)', description: 5, displayOrder: 1.5, isActive: 'yes', extra: 1 });
	assert.deepEqual(codes(r).sort(), [
		'description:INVALID_TYPE', 'displayOrder:INVALID_TYPE', 'extra:UNKNOWN_FIELD', 'isActive:INVALID_TYPE', 'name:REQUIRED', 'url:INVALID_URL'
	]);
});

test('missing name and url are REQUIRED', () => {
	assert.deepEqual(codes(validateCreateServiceLink({})).sort(), ['name:REQUIRED', 'url:REQUIRED']);
});

test('length and range limits', () => {
	const r = validateCreateServiceLink({ name: 'n'.repeat(101), url: 'https://a.edu', description: 'd'.repeat(501), displayOrder: 10000, reason: 'r'.repeat(201) });
	assert.deepEqual(codes(r).sort(), ['description:TOO_LONG', 'displayOrder:OUT_OF_RANGE', 'name:TOO_LONG', 'reason:TOO_LONG']);
	assert.deepEqual(codes(validateCreateServiceLink({ name: 'n'.repeat(100), url: 'https://a.edu', displayOrder: -1 })), ['displayOrder:OUT_OF_RANGE']);
});

test('body must be an object', () => {
	for (const body of [null, [], 'x', 3]) assert.deepEqual(codes(validateCreateServiceLink(body)), ['(body):INVALID_TYPE']);
});

test('update needs at least one field', () => {
	const r = validateUpdateServiceLink({});
	assert.ok(!r.ok);
	assert.equal(r.errors[0]!.code, 'EMPTY_UPDATE');
	const onlyReason = validateUpdateServiceLink({ reason: 'x' });
	assert.ok(!onlyReason.ok);
});

test('update validates only the fields sent', () => {
	assert.deepEqual(validateUpdateServiceLink({ isActive: true }), { ok: true, value: { isActive: true }, reason: undefined });
	assert.deepEqual(validateUpdateServiceLink({ description: null }), { ok: true, value: { description: null }, reason: undefined });
	const bad = validateUpdateServiceLink({ url: 'javascript:x', unknown: 1 });
	assert.ok(!bad.ok);
	assert.deepEqual(bad.errors.map((e) => e.code).sort(), ['INVALID_URL', 'UNKNOWN_FIELD']);
});

test('parseServiceId accepts positive integers only', () => {
	assert.equal(parseServiceId('12'), '12');
	for (const raw of ['0', '-1', 'abc', '1.5', '01', '', undefined, '9'.repeat(19)]) assert.equal(parseServiceId(raw), null, String(raw));
});

test('parseIfMatch', () => {
	assert.equal(parseIfMatch(undefined), null);
	assert.equal(parseIfMatch('*'), null);
	assert.equal(parseIfMatch('"3"'), 3);
	assert.equal(parseIfMatch('W/"3"'), 3);
	assert.equal(parseIfMatch('3'), 3);
	assert.equal(parseIfMatch('"abc"'), 'invalid');
});
