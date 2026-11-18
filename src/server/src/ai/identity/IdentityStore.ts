import type { AIRole } from '../types.ts';

/**
 * Reads who a user is and what they may do. Implemented over the main database by
 * repositories/ai/IdentityRepository.ts; tests use an in-memory fake.
 */
export interface IdentityStore {
	getRoles(userId: string): Promise<AIRole[]>,
	getFacultyId(userId: string): Promise<string | null>,
	hasPermission(userId: string, permissionCode: string): Promise<boolean>
}
