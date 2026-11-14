import type { NextFunction, Request, Response } from 'express';
import { generate429Response } from '../helper/generate429Response.ts';

interface Entry { windowStart: number, count: number }

/**
 * Fixed-window rate limiter, kept in server memory (resets on restart, not shared between
 * servers; fine for Phase 1). Counts per user (`res.locals.user.sub`, set by
 * validateAccessToken), falling back to the IP address. Over the limit: 429 + Retry-After.
 * Put it after the access-token check so `res.locals.user` is filled in.
 */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now) {
	const entries = new Map<string, Entry>();

	return (req: Request, res: Response, next: NextFunction): void => {
		const key = (res.locals.user as { sub?: string } | undefined)?.sub ?? req.ip ?? 'unknown';
		const t = now();

		// drop finished windows so the map does not grow forever
		for (const [k, e] of entries) {
			if (t - e.windowStart >= windowMs) entries.delete(k);
		}

		const entry = entries.get(key);
		if (!entry) {
			entries.set(key, { windowStart: t, count: 1 });
			return next();
		}
		if (entry.count < limit) {
			entry.count++;
			return next();
		}

		const retryAfter = Math.max(1, Math.ceil((entry.windowStart + windowMs - t) / 1000));
		const response = generate429Response(retryAfter, `Too many requests, please try again in ${retryAfter} seconds`);
		return void res.status(response.statusCode)
			.set('Retry-After', String(retryAfter))
			.json(response.get());
	};
}
