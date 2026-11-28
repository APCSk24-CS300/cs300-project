import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AvatarFileStorage, getAvatarFileName, isLegalAvatarUrl } from '../../src/services/AvatarFileStorage.ts';

test('stores validated image files outside the database and returns a legal URL', async () => {
	const directory = await mkdtemp(path.join(os.tmpdir(), 'profile-avatar-'));
	try {
		const storage = new AvatarFileStorage(directory);
		const bytes = Buffer.from('image bytes');
		const saved = await storage.save(bytes, 'image/jpeg');
		assert.match(saved.url, /^\/api\/v1\/profile\/avatar\/files\/[0-9a-f-]+\.jpg$/);
		assert.equal(isLegalAvatarUrl(saved.url), true);
		assert.equal(getAvatarFileName(saved.url), saved.fileName);
		assert.deepEqual(await storage.read(saved.fileName), bytes);
		assert.equal(await storage.read('../outside.jpg'), null);
		await storage.remove(saved.fileName);
		assert.equal(await storage.read(saved.fileName), null);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
});

test('URL legality rejects external origins and non-HTTP schemes', () => {
	assert.equal(isLegalAvatarUrl('https://example.com/avatar.png'), false);
	assert.equal(isLegalAvatarUrl('javascript:alert(1)'), false);
	assert.equal(isLegalAvatarUrl('//profile.local/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174000.png'), false);
	assert.equal(isLegalAvatarUrl('/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174000.png?download=1'), false);
	assert.equal(isLegalAvatarUrl('/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174000.png'), true);
});
