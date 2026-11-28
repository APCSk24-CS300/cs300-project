import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import config from '../../src/config/config.ts';
import { createAvatarRoute } from '../../src/routes/AvatarRoute.ts';
import { AvatarService } from '../../src/services/AvatarService.ts';

test('serves only the authenticated owner avatar through its URL', async () => {
	const secret = 'avatar-route-test-secret';
	config.jwt.secret = secret;
	const fileName = '123e4567-e89b-42d3-a456-426614174000.png';
	const avatarUrl = `/api/v1/profile/avatar/files/${fileName}`;
	const bytes = Buffer.from('decoded image bytes');
	const app = express();
	app.use('/api/v1/profile/avatar', createAvatarRoute(new AvatarService({
		async getAvatar(userId) { return userId === 'owner' ? avatarUrl : null; },
		async setAvatar() { return 'updated'; }
	}, {
		async save() { return { fileName, url: avatarUrl }; },
		async read(name) { return name === fileName ? bytes : null; },
		async remove() {}
	})));
	const server = app.listen(0, '127.0.0.1');
	try {
		await new Promise<void>((resolve) => server.once('listening', resolve));
		const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
		const url = `${base}/api/v1/profile/avatar/files/${fileName}`;
		assert.equal((await fetch(url)).status, 401);
		const owner = await fetch(url, { headers: { Authorization: `Bearer ${jwt.sign({ sub: 'owner' }, secret)}` } });
		assert.equal(owner.status, 200);
		assert.equal(owner.headers.get('content-type'), 'image/png');
		assert.equal(owner.headers.get('x-content-type-options'), 'nosniff');
		assert.deepEqual(Buffer.from(await owner.arrayBuffer()), bytes);
		const other = await fetch(url, { headers: { Authorization: `Bearer ${jwt.sign({ sub: 'other' }, secret)}` } });
		assert.equal(other.status, 404);
	} finally {
		await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
	}
});
