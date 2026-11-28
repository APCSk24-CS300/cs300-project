import { cookies } from 'next/headers';
import { readBackendUser } from '@/libs/backend-session';
import { decrypt } from '@/libs/session';
export async function GET() {
 const jar = await cookies();
 const token = jar.get('backend_access')?.value;
 const session = await decrypt(jar.get('session')?.value);
 if (!token || !session) return Response.json({ message: 'Sign in to continue' }, { status: 401 });
 try {
  const user = await readBackendUser(token, session.role);
  if (!user) { jar.delete('session'); jar.delete('backend_access'); return Response.json({ message: 'Session expired' }, { status: 401 }); }
  return Response.json(user, { headers: { 'Cache-Control': 'no-store' } });
 } catch { return Response.json({ message: 'Session service unavailable' }, { status: 503 }); }
}
