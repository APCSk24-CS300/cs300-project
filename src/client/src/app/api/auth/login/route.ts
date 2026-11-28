import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { backendUrl, readBackendUser, sameOrigin } from '@/libs/backend-session';
export async function POST(request: Request) {
 if (!sameOrigin(request)) return Response.json({ message: 'Forbidden origin' }, { status: 403 });
 try {
  const { email, password, role } = await request.json();
  if (!['student', 'manager', 'admin'].includes(role) || typeof email !== 'string' || typeof password !== 'string') return Response.json({ message: 'Invalid credentials' }, { status: 400 });
  const secret = process.env.SESSION_SECRET;
  if (!secret) return Response.json({ message: 'Session configuration unavailable' }, { status: 503 });
  const response = await fetch(`${backendUrl()}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }), cache: 'no-store' });
  if (!response.ok) return Response.json({ message: 'Invalid credentials' }, { status: 401 });
  const result = await response.json();
  const token = result.payload?.data?.token;
  if (typeof token !== 'string') throw new Error('Invalid login response');
  const user = await readBackendUser(token, role);
  if (!user) return Response.json({ message: 'Account or selected role unavailable' }, { status: 403 });
  const session = await new SignJWT({ userId: user.userId, role: user.role }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('1h').sign(new TextEncoder().encode(secret));
  const jar = await cookies();
  const options = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: process.env.NODE_ENV === 'production', maxAge: 3600 };
  jar.set('session', session, options);
  jar.set('backend_access', token, options);
  return Response.json({ user });
 } catch { return Response.json({ message: 'Sign-in service unavailable' }, { status: 503 }); }
}
