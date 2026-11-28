import type { Request, Response } from 'express';
import type { SessionService } from '../services/SessionService.ts';

/** Contract envelopes (openapi.yaml): `{ success, data }` and `ErrorResponse { success, code, message, errors? }`. */
function fail(res: Response, status: number, code: string, message: string, errors?: { field: string; message: string }[]) {
	if (status === 401) res.set('WWW-Authenticate', 'Bearer realm="api"');
	res.status(status).json({ success: false, code, message, ...(errors ? { errors } : {}) });
}

function subjectOf(res: Response): string | null {
	const sub = (res.locals.user as { sub?: unknown } | undefined)?.sub;
	return typeof sub === 'string' && sub.trim() ? sub : null;
}

/** /api/v1/auth: login, current-user context, logout (UC-01, UC-02). */
export class SessionController {
	private readonly service: SessionService;

	constructor(service: SessionService) {
		this.service = service;
	}

	login = async (req: Request, res: Response): Promise<void> => {
		const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
		const email = typeof body.email === 'string' ? body.email.trim() : '';
		const password = typeof body.password === 'string' ? body.password : '';
		const errors = [
			...(email ? [] : [{ field: 'email', message: 'Email is required' }]),
			...(password ? [] : [{ field: 'password', message: 'Password is required' }])
		];
		if (errors.length > 0) return fail(res, 400, 'VALIDATION_FAILED', 'Validation failed', errors);
		try {
			const result = await this.service.login(email, password);
			if (result.kind === 'invalid') return fail(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
			if (result.kind === 'disabled') return fail(res, 403, 'ACCOUNT_DISABLED', 'This account is disabled');
			res.set('Cache-Control', 'no-store').json({ success: true, data: { token: result.token, expiresAt: result.expiresAt } });
		} catch (err) {
			console.error('[auth/v1] login failed', err);
			fail(res, 503, 'SERVICE_UNAVAILABLE', 'Sign-in is temporarily unavailable');
		}
	};

	me = async (_req: Request, res: Response): Promise<void> => {
		const userId = subjectOf(res);
		if (!userId) return fail(res, 401, 'UNAUTHENTICATED', 'Authentication is required');
		try {
			const result = await this.service.me(userId);
			if (result.kind === 'missing') return fail(res, 401, 'UNAUTHENTICATED', 'Account unavailable');
			if (result.kind === 'disabled') return fail(res, 403, 'ACCOUNT_DISABLED', 'This account is disabled');
			res.set('Cache-Control', 'no-store').json({ success: true, data: result.context });
		} catch (err) {
			console.error('[auth/v1] me failed', err);
			fail(res, 503, 'SERVICE_UNAVAILABLE', 'Session service unavailable');
		}
	};

	/** No server-side token store exists yet: the token simply expires (gap recorded in 007 verification.md). */
	logout = async (_req: Request, res: Response): Promise<void> => {
		res.set('Cache-Control', 'no-store').json({ success: true, message: 'Signed out' });
	};
}
