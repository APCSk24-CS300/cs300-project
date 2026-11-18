import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../../src/middleware/RateLimitMiddleware.ts';

function run(limiter: any, sub?: string) {
	const out: any = { nexted: false, status: 0, headers: {}, body: undefined };
	const res: any = {
		locals: sub ? { user: { sub } } : {},
		status(s: number) { out.status = s; return res; },
		set(k: string, v: string) { out.headers[k] = v; return res; },
		json(b: unknown) { out.body = b; return res; }
	};
	limiter({ ip: '1.2.3.4' }, res, () => { out.nexted = true; });
	return out;
}

test('allows up to the limit, then answers 429 with Retry-After', () => {
	let t = 0;
	const limiter = createRateLimiter(3, 60_000, () => t);
	for (let i = 0; i < 3; i++) assert.equal(run(limiter, 'a').nexted, true);

	t = 10_000;
	const blocked = run(limiter, 'a');
	assert.equal(blocked.nexted, false);
	assert.equal(blocked.status, 429);
	assert.equal(blocked.headers['Retry-After'], '50');
	assert.equal(blocked.body.statusCode, 429);
});

test('counts each user separately and falls back to IP', () => {
	const limiter = createRateLimiter(1, 60_000, () => 0);
	assert.equal(run(limiter, 'a').nexted, true);
	assert.equal(run(limiter, 'b').nexted, true);
	assert.equal(run(limiter, 'a').status, 429);
	assert.equal(run(limiter).nexted, true);     // ip key
	assert.equal(run(limiter).status, 429);
});

test('a new window starts after windowMs', () => {
	let t = 0;
	const limiter = createRateLimiter(1, 1000, () => t);
	assert.equal(run(limiter, 'a').nexted, true);
	assert.equal(run(limiter, 'a').status, 429);
	t = 1000;
	assert.equal(run(limiter, 'a').nexted, true);
});
