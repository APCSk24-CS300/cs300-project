import { Router } from 'express';
import type { Pool } from 'pg';
import Validator from '../middleware/ValidatorMiddleware.ts';
/** Session identity follows UserRole/Role; no role is inferred from an ID. */
export function createSessionRoute(pool: Pick<Pool, 'query'>) {
 const router = Router();
 router.get('/me', Validator.validateAccessToken, async (_req, res) => {
  try {
   const { rows } = await pool.query(`SELECT u.user_id, u.email, u.full_name, u.avatar_url,
    s.faculty_id, ARRAY(SELECT r.code FROM "UserRole" ur JOIN "Role" r ON r.role_id=ur.role_id WHERE ur.user_id=u.user_id) AS roles,
    ARRAY(SELECT DISTINCT p.code FROM "UserRole" ur JOIN "RolePermission" rp ON rp.role_id=ur.role_id JOIN "Permission" p ON p.permission_id=rp.permission_id WHERE ur.user_id=u.user_id) AS permissions
    FROM "User" u LEFT JOIN "Student" s ON s.user_id=u.user_id WHERE u.user_id=$1 AND u.is_active IS NOT FALSE`, [res.locals.user.sub]);
   if (!rows[0]) { res.status(401).json({ success: false, message: 'Account unavailable' }); return; }
   const u = rows[0];
   res.set('Cache-Control', 'no-store').json({ userId: u.user_id, email: u.email, fullName: u.full_name, avatarUrl: u.avatar_url, facultyId: u.faculty_id, studentNumber: null, roles: u.roles, permissions: u.permissions });
  } catch { res.status(503).json({ success: false, message: 'Session unavailable' }); }
 });
 return router;
}
