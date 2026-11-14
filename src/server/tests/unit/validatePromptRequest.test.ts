import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validatePromptRequest } from '../../src/helper/validatePromptRequest.ts';

function details(body: unknown): string[] {
	const r = validatePromptRequest(body);
	assert.equal(r.ok, false);
	return r.ok ? [] : r.details;
}

test('accepts a message and trims it; history defaults to empty', () => {
	const r = validatePromptRequest({ message: '  hello  ' });
	assert.deepEqual(r, { ok: true, value: { message: 'hello', history: [] } });
});

test('rejects missing, non-string, blank and too long messages', () => {
	assert.deepEqual(details({}), ['message is required']);
	assert.deepEqual(details(undefined), ['message is required']);
	assert.deepEqual(details({ message: 5 }), ['message must be a string']);
	assert.deepEqual(details({ message: '   ' }), ['message must not be empty']);
	assert.deepEqual(details({ message: 'a'.repeat(2001) }), ['message must be at most 2000 characters']);
	assert.equal(validatePromptRequest({ message: 'a'.repeat(2000) }).ok, true);
});

test('accepts valid history in order', () => {
	const history = [{ role: 'user', text: 'q1' }, { role: 'assistant', text: 'a1' }];
	const r = validatePromptRequest({ message: 'q2', history });
	assert.deepEqual(r, { ok: true, value: { message: 'q2', history } });
});

test('rejects bad history: not an array, too many turns, bad role, bad text', () => {
	assert.deepEqual(details({ message: 'x', history: 'no' }), ['history must be an array']);

	const many = Array.from({ length: 21 }, () => ({ role: 'user', text: 'x' }));
	assert.deepEqual(details({ message: 'x', history: many }), ['history must have at most 20 turns']);
	const twenty = many.slice(0, 20);
	assert.equal(validatePromptRequest({ message: 'x', history: twenty }).ok, true);

	assert.deepEqual(
		details({ message: 'x', history: [{ role: 'system', text: 'hi' }] }),
		['history[0].role must be "user" or "assistant"']);
	assert.deepEqual(
		details({ message: 'x', history: [{ role: 'user', text: ' ' }] }),
		['history[0].text must not be empty']);
	assert.deepEqual(
		details({ message: 'x', history: [{ role: 'user', text: 'a'.repeat(2001) }] }),
		['history[0].text must be at most 2000 characters']);
	assert.deepEqual(details({ message: 'x', history: [null] }), ['history[0] must be an object']);
});

test('reports every problem at once', () => {
	const d = details({ message: '', history: [{ role: 'bot', text: 3 }] });
	assert.equal(d.length, 3);
});
