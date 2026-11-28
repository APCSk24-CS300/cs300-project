import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAvatar, MAX_AVATAR_BYTES } from '../../src/helper/validateAvatar.ts';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', 'base64');
export const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==', 'base64');

function crc32(bytes: Buffer): number {
	let crc = 0xffffffff;
	for (const byte of bytes) {
		crc ^= byte;
		for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
	}
	return (crc ^ 0xffffffff) >>> 0;
}

function pngWithDeclaredWidth(width: number): Buffer {
	const malformed = Buffer.from(png);
	malformed.writeUInt32BE(width, 16);
	malformed.writeUInt32BE(crc32(malformed.subarray(12, 29)), 29);
	return malformed;
}

function pngAtExactLimit(): Buffer {
	const endChunkOffset = png.length - 12;
	const payload = Buffer.alloc(MAX_AVATAR_BYTES - png.length - 12, 32);
	payload[0] = 120;
	payload[1] = 0;
	const chunk = Buffer.alloc(payload.length + 12);
	chunk.writeUInt32BE(payload.length, 0);
	Buffer.from('tEXt').copy(chunk, 4);
	payload.copy(chunk, 8);
	chunk.writeUInt32BE(crc32(chunk.subarray(4, chunk.length - 4)), chunk.length - 4);
	return Buffer.concat([png.subarray(0, endChunkOffset), chunk, png.subarray(endChunkOffset)]);
}

test('validates decoded PNG/JPEG content rather than extension or declared type', async () => {
	assert.equal(await validateAvatar(png), 'image/png');
	assert.equal(await validateAvatar(jpeg), 'image/jpeg');
	assert.equal(await validateAvatar(Buffer.from('not an image')), null);
	assert.equal(await validateAvatar(png.subarray(0, 24)), null);
	assert.equal(await validateAvatar(Buffer.concat([Buffer.from([255, 216, 255]), Buffer.from('fake jpeg')])), null);
	// The compressed stream is valid for a 1x1 image, but not for the declared 2x1 dimensions.
	assert.equal(await validateAvatar(pngWithDeclaredWidth(2)), null);
	// Frame and scan markers without actual JPEG scan data must not pass.
	const markerOnlyJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0xff, 0xd9]);
	assert.equal(await validateAvatar(markerOnlyJpeg), null);
	const corruptPng = Buffer.from(png);
	corruptPng[45] ^= 1;
	assert.equal(await validateAvatar(corruptPng), null);
	assert.equal(await validateAvatar(jpeg.subarray(0, jpeg.length - 2)), null);
});

test('accepts the inclusive 10 MiB boundary and rejects a larger file', async () => {
	const exact = pngAtExactLimit();
	assert.equal(exact.length, MAX_AVATAR_BYTES);
	assert.equal(await validateAvatar(exact), 'image/png');
	assert.equal(await validateAvatar(Buffer.alloc(MAX_AVATAR_BYTES + 1)), null);
});
