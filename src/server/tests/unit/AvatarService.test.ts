import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AvatarService } from '../../src/services/AvatarService.ts';
import type { AvatarFiles } from '../../src/services/AvatarService.ts';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64');
const firstFile = { fileName: '123e4567-e89b-42d3-a456-426614174000.png', url: '/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174000.png' };

test('stores file separately and persists only its legal URL', async () => {
	let url: string | null = null;
	const files = new Map<string, Buffer>();
	const removed: string[] = [];
	const fileStore: AvatarFiles = {
		async save(bytes, mime) {
			assert.equal(mime, 'image/png');
			files.set(firstFile.fileName, bytes);
			return firstFile;
		},
		async read(fileName) { return files.get(fileName) ?? null; },
		async remove(fileName) { files.delete(fileName); removed.push(fileName); }
	};
	const service = new AvatarService({
		async getAvatar(id) { return id === 'owner' ? url : null; },
		async setAvatar(_id, value, expected) { if (url !== expected) return 'conflict'; url = value; return 'updated'; }
	}, fileStore);
	const upload = await service.upload('owner', png);
	assert.equal(upload.status, 200);
	assert.deepEqual(url, firstFile.url);
	assert.deepEqual(files.get(firstFile.fileName), png);
	assert.equal(JSON.stringify(upload).includes(png.toString('base64')), false);
	const read = await service.read('owner', firstFile.fileName);
	assert.equal(read.status, 200);
	if (read.status === 200) assert.deepEqual(read.bytes, png);
	assert.equal((await service.read('other-user', firstFile.fileName)).status, 404);
	assert.equal((await service.remove('owner')).status, 200);
	assert.equal(url, null);
	assert.deepEqual(removed, [firstFile.fileName]);
});

test('database failure removes the newly written file and preserves the saved URL', async () => {
	let currentUrl: string | null = '/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174000.png';
	const files = new Map([[firstFile.fileName, png]]);
	const service = new AvatarService({
		async getAvatar() { return currentUrl; },
		async setAvatar() { throw new Error('private database details'); }
	}, {
		async save(bytes) { files.set('123e4567-e89b-42d3-a456-426614174001.png', bytes); return { fileName: '123e4567-e89b-42d3-a456-426614174001.png', url: '/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174001.png' }; },
		async read(fileName) { return files.get(fileName) ?? null; },
		async remove(fileName) { files.delete(fileName); }
	});
	const result = await service.upload('owner', png);
	assert.equal(result.status, 500);
	assert.equal(currentUrl, firstFile.url);
	assert.equal(files.has('123e4567-e89b-42d3-a456-426614174001.png'), false);
	assert.equal(JSON.stringify(result).includes('private database'), false);
});

test('rejects malformed content and illegal storage URLs without changing the saved URL', async () => {
	let currentUrl: string | null = 'https://example.edu/old-avatar.png';
	let writes = 0;
	const service = new AvatarService({
		async getAvatar() { return currentUrl; },
		async setAvatar(_id, value, expected) { if (currentUrl !== expected) return 'conflict'; currentUrl = value; return 'updated'; }
	}, {
		async save() { writes++; return { fileName: 'not-a-file', url: 'javascript:alert(1)' }; },
		async read() { return null; },
		async remove() {}
	});
	assert.equal((await service.upload('owner', Buffer.from('spoof'))).status, 400);
	assert.equal(writes, 0);
	assert.equal((await service.upload('owner', png)).status, 500);
	assert.equal(currentUrl, 'https://example.edu/old-avatar.png');
});

test('does not report success when a concurrent avatar change wins', async () => {
	let currentUrl: string | null = '/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174000.png';
	let removed = false;
	const service = new AvatarService({
		async getAvatar() { return currentUrl; },
		async setAvatar() { currentUrl = '/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174002.png'; return 'conflict'; }
	}, {
		async save() { return { fileName: '123e4567-e89b-42d3-a456-426614174001.png', url: '/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174001.png' }; },
		async read() { return null; },
		async remove() { removed = true; }
	});
	const result = await service.upload('owner', png);
	assert.equal(result.status, 409);
	assert.equal(removed, true);
	assert.equal(currentUrl, '/api/v1/profile/avatar/files/123e4567-e89b-42d3-a456-426614174002.png');
});
