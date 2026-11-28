import { validateAvatar } from '../helper/validateAvatar.ts';
import { getAvatarFileName, isLegalAvatarUrl } from './AvatarFileStorage.ts';

export interface AvatarStore {
	getAvatar(userId: string): Promise<string | null>;
	setAvatar(userId: string, url: string | null, expectedUrl: string | null): Promise<'updated' | 'missing' | 'conflict'>;
}

export interface AvatarFile {
	fileName: string;
	url: string;
}

export interface AvatarFiles {
	save(bytes: Buffer, mime: 'image/png' | 'image/jpeg'): Promise<AvatarFile>;
	read(fileName: string): Promise<Buffer | null>;
	remove(fileName: string): Promise<void>;
}

export class AvatarService {
	private readonly store: AvatarStore;
	private readonly files: AvatarFiles;

	constructor(store: AvatarStore, files: AvatarFiles) {
		this.store = store;
		this.files = files;
	}

	async upload(userId: string, bytes: Buffer) {
		const mime = await validateAvatar(bytes);
		if (!mime) return { status: 400, body: { success: false, code: 'UNSUPPORTED_FILE', message: 'Choose a valid JPG or PNG image up to 10 MB.' } };

		let previousUrl: string | null = null;
		let created: AvatarFile | null = null;
		try {
			previousUrl = await this.store.getAvatar(userId);
			created = await this.files.save(bytes, mime);
			if (!isLegalAvatarUrl(created.url)) {
				await this.files.remove(created.fileName);
				return { status: 500, body: { success: false, message: 'Picture could not be saved. Please retry.' } };
			}
			const update = await this.store.setAvatar(userId, created.url, previousUrl);
			if (update !== 'updated') {
				await this.files.remove(created.fileName);
				return update === 'missing'
					? { status: 404, body: { success: false, message: 'Profile not found' } }
					: { status: 409, body: { success: false, message: 'Picture changed while uploading. Please retry.' } };
			}
		} catch {
			if (created) await this.files.remove(created.fileName).catch(() => undefined);
			return { status: 500, body: { success: false, message: 'Picture could not be saved. Please retry.' } };
		}

		const previousFileName = getAvatarFileName(previousUrl);
		if (previousFileName && previousFileName !== created.fileName) await this.files.remove(previousFileName).catch(() => undefined);
		return { status: 200, body: { success: true, data: { avatarUrl: created.url } } };
	}

	async remove(userId: string) {
		try {
			const previousUrl = await this.store.getAvatar(userId);
			const update = await this.store.setAvatar(userId, null, previousUrl);
			if (update === 'missing') return { status: 404, body: { success: false, message: 'Profile not found' } };
			if (update === 'conflict') return { status: 409, body: { success: false, message: 'Picture changed while removing. Please retry.' } };
			const fileName = getAvatarFileName(previousUrl);
			if (fileName) await this.files.remove(fileName).catch(() => undefined);
			return { status: 200, body: { success: true, message: 'Avatar removed successfully' } };
		} catch {
			return { status: 500, body: { success: false, message: 'Picture could not be removed. Please retry.' } };
		}
	}

	async read(userId: string, fileName: string) {
		try {
			const savedUrl = await this.store.getAvatar(userId);
			if (getAvatarFileName(savedUrl) !== fileName) return { status: 404 as const };
			const bytes = await this.files.read(fileName);
			if (!bytes) return { status: 404 as const };
			const mime = fileName.toLowerCase().endsWith('.png') ? 'image/png' as const : 'image/jpeg' as const;
			return { status: 200 as const, bytes, mime };
		} catch {
			return { status: 500 as const };
		}
	}
}
