/**
 * Mock avatar file store (plan 006 §6, approved Q7): bytes stay in memory because localStorage is too
 * small for 10 MiB. Only the URL is persisted (on the user, like the BE's `User.avatar_url`). After a
 * reload the file is gone, so the file read answers 404 and the UI shows its UC-03 A9 fallback.
 */
export interface MockAvatarFile {
  bytes: Uint8Array;
  mime: "image/png" | "image/jpeg";
}

const files = new Map<string, MockAvatarFile>();

export function putAvatarFile(name: string, file: MockAvatarFile): void {
  files.set(name, file);
}

export function getAvatarFile(name: string): MockAvatarFile | undefined {
  return files.get(name);
}

export function deleteAvatarFile(name: string): void {
  files.delete(name);
}

export function clearAvatarFiles(): void {
  files.clear();
}
