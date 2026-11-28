export const MAX_AVATAR_BYTES = 10 * 1024 * 1024;
/** Client feedback only; the API independently checks actual file contents. */
export function getAvatarError(file: Pick<File, 'size' | 'type'>): string | null {
 if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Choose a JPG or PNG image.';
 if (!file.size || file.size > MAX_AVATAR_BYTES) return 'Choose an image up to 10 MB.';
 return null;
}
