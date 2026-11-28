import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

const { proxyProfile } = vi.hoisted(() => ({ proxyProfile: vi.fn() }));
vi.mock('@/libs/backend-session', () => ({ proxyProfile }));

describe('profile image URL bridge', () => {
	beforeEach(() => proxyProfile.mockReset());

	it('forwards same-origin avatar file reads through the authenticated profile bridge', async () => {
		const response = new Response('image bytes', { status: 200 });
		proxyProfile.mockResolvedValue(response);
		const request = new Request('http://localhost/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174000.png');
		const result = await GET(request, { params: Promise.resolve({ segments: ['avatar', 'files', '123e4567-e89b-42d3-a456-426614174000.png'] }) });
		expect(result).toBe(response);
		expect(proxyProfile).toHaveBeenCalledWith(request, '/avatar/files/123e4567-e89b-42d3-a456-426614174000.png');
	});

	it('does not forward other unrecognized profile paths', async () => {
		const request = new Request('http://localhost/api/v1/profile/admin');
		const result = await GET(request, { params: Promise.resolve({ segments: ['admin'] }) });
		expect(result.status).toBe(404);
		expect(proxyProfile).not.toHaveBeenCalled();
	});
});
