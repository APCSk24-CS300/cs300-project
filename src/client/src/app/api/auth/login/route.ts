// app/api/auth/login/route.ts  (mock BE, xoá khi có BE thật)
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

const USERS = {
  'student@test.com':   { userId: 1, role: 'student',   fullName: 'Test Student' },
  'organizer@test.com': { userId: 2, role: 'organizer', fullName: 'Test Organizer' },
  'admin@test.com':     { userId: 3, role: 'admin',     fullName: 'Test Admin' },
} as const;

export async function POST(req: Request) {
  const { email, password, role } = await req.json();
  const u = USERS[email as keyof typeof USERS];
  if (!u || password !== '123456' || u.role !== role)
    return Response.json({ message: 'Invalid credentials' }, { status: 401 });

  const token = await new SignJWT({ userId: String(u.userId), role: u.role })
    .setProtectedHeader({ alg: 'HS256' }).setExpirationTime('7d')
    .sign(new TextEncoder().encode(process.env.SESSION_SECRET));

  (await cookies()).set('session', token, { httpOnly: true, sameSite: 'lax', path: '/' });
  return Response.json({ user: { ...u, email, avatarUrl: null, permissions: [] } });
}