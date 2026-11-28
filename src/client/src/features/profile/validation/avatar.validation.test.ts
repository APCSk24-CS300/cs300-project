import { expect, it } from 'vitest';
import { getAvatarError, MAX_AVATAR_BYTES } from './avatar.validation';
it('accepts JPG/PNG at exactly the size limit, rejects oversized/unsupported/empty files', () => {
 for (const type of ['image/jpeg', 'image/png']) expect(getAvatarError({ type, size: MAX_AVATAR_BYTES })).toBeNull();
 expect(getAvatarError({ type: 'image/png', size: MAX_AVATAR_BYTES+1 })).toBeTruthy();
 expect(getAvatarError({ type: 'image/gif', size: 100 })).toBeTruthy();
 expect(getAvatarError({ type: 'image/png', size: 0 })).toBeTruthy();
});
