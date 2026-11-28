import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface StoredAvatarFile {
	fileName: string;
	url: string;
}

const FILE_NAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png)$/i;
const DEFAULT_DIRECTORY = resolve(process.cwd(), 'data/avatars');

/** Files are persisted outside PostgreSQL; the database stores only their URL. */
export class AvatarFileStorage {
	private readonly directory: string;

	constructor(directory = process.env.AVATAR_STORAGE_DIRECTORY || DEFAULT_DIRECTORY) {
		this.directory = resolve(directory);
	}

	async save(bytes: Buffer, mime: 'image/png' | 'image/jpeg'): Promise<StoredAvatarFile> {
		await mkdir(this.directory, { recursive: true, mode: 0o700 });
		const extension = mime === 'image/png' ? 'png' : 'jpg';
		const fileName = `${randomUUID()}.${extension}`;
		await writeFile(join(this.directory, fileName), bytes, { flag: 'wx', mode: 0o600 });
		return { fileName, url: `/api/v1/profile/avatar/files/${fileName}` };
	}

	async read(fileName: string): Promise<Buffer | null> {
		if (!FILE_NAME_PATTERN.test(fileName)) return null;
		try {
			return await readFile(join(this.directory, fileName));
		} catch (error) {
			if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return null;
			throw error;
		}
	}

	async remove(fileName: string): Promise<void> {
		if (!FILE_NAME_PATTERN.test(fileName)) return;
		await rm(join(this.directory, fileName), { force: true });
	}
}

export function isLegalAvatarUrl(value: unknown): value is string {
	if (typeof value !== 'string' || value.length > 2048) return false;
	const match = /^\/api\/v1\/profile\/avatar\/files\/([^/?#]+)$/.exec(value);
	if (!match || !FILE_NAME_PATTERN.test(match[1])) return false;
	try {
		const url = new URL(value, 'http://profile.local');
		return url.origin === 'http://profile.local' &&
			url.pathname === value && url.search === '' && url.hash === '';
	} catch {
		return false;
	}
}

export function getAvatarFileName(url: string | null): string | null {
	if (!isLegalAvatarUrl(url)) return null;
	const fileName = url.slice(url.lastIndexOf('/') + 1);
	return FILE_NAME_PATTERN.test(fileName) ? fileName : null;
}
