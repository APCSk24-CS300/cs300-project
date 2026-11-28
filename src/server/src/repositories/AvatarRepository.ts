import type { Pool } from 'pg';
/** Existing User.avatar_url TEXT stores only the URL of a separately stored image file. */
export class AvatarRepository {
 private pool: Pick<Pool, 'query'>;
 constructor(pool: Pick<Pool, 'query'>) { this.pool = pool; }
 async getAvatar(userId: string): Promise<string | null> {
  const result = await this.pool.query('SELECT avatar_url FROM "User" WHERE user_id = $1 AND is_active IS NOT FALSE', [userId]);
  return result.rows[0]?.avatar_url ?? null;
 }
 async setAvatar(userId: string, url: string | null, expectedUrl: string | null): Promise<'updated' | 'missing' | 'conflict'> {
  const result = await this.pool.query('UPDATE "User" SET avatar_url = $2 WHERE user_id = $1 AND is_active IS NOT FALSE AND avatar_url IS NOT DISTINCT FROM $3 RETURNING user_id', [userId, url, expectedUrl]);
  if (result.rows.length > 0) return 'updated';
  const existing = await this.pool.query('SELECT 1 FROM "User" WHERE user_id = $1 AND is_active IS NOT FALSE', [userId]);
  return existing.rows.length > 0 ? 'conflict' : 'missing';
 }
}
