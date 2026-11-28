import sharp from 'sharp';

export const MAX_AVATAR_BYTES = 10 * 1024 * 1024;

type AvatarMime = 'image/png' | 'image/jpeg';

function declaredImageMime(bytes: Buffer): AvatarMime | null {
	if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
	if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
	return null;
}

/**
 * Validate image bytes independently of the filename and declared MIME type.
 * Sharp's full pixel-statistics pass forces libvips to decode the image data,
 * so valid-looking headers and frame/scan markers alone are not sufficient.
 */
export async function validateAvatar(bytes: Buffer): Promise<AvatarMime | null> {
	if (!bytes.length || bytes.length > MAX_AVATAR_BYTES) return null;
	const expectedMime = declaredImageMime(bytes);
	if (!expectedMime) return null;

	try {
		const image = sharp(bytes, { failOn: 'warning' });
		const metadata = await image.metadata();
		const expectedFormat = expectedMime === 'image/png' ? 'png' : 'jpeg';
		if (metadata.format !== expectedFormat || !metadata.width || !metadata.height) return null;
		await image.stats();
		return expectedMime;
	} catch {
		return null;
	}
}
