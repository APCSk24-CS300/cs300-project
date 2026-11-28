import { cookies } from 'next/headers';
import type { RoleCode } from './roles';

export const backendUrl = () => process.env.API_BACKEND_URL || 'http://localhost:8080';
export async function readBackendUser(token: string, preferredRole?: RoleCode) {
 const response = await fetch(`${backendUrl()}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
 if (!response.ok) return null;
 const identity = await response.json();
 const roles: RoleCode[] = (identity.roles as string[]).flatMap((role) => role === 'administrator' ? ['admin' as const] : role === 'student' || role === 'manager' ? [role] : []);
 const role = preferredRole && roles.includes(preferredRole) ? preferredRole : preferredRole ? null : roles[0];
 if (!role) return null;
 return { userId: identity.userId, email: identity.email, fullName: identity.fullName, avatarUrl: identity.avatarUrl, studentNumber: null, facultyId: identity.facultyId, role, permissions: identity.permissions };
}
export function sameOrigin(request: Request): boolean {
 const origin = request.headers.get('origin');
 return !origin || origin === new URL(request.url).origin;
}
/** Bound multipart buffering before forwarding; never buffer an unbounded upload. */
async function readBody(request: Request): Promise<ArrayBuffer | undefined> {
 if (['GET', 'HEAD'].includes(request.method) || !request.body) return undefined;
 const limit = 10 * 1024 * 1024 + 65536;
 if (Number(request.headers.get('content-length') || 0) > limit) throw new RangeError('Upload too large');
 const reader = request.body.getReader();
 const chunks: Uint8Array[] = []; let size = 0;
 while (true) {
  const part = await reader.read(); if (part.done) break;
  size += part.value.byteLength;
  if (size > limit) { await reader.cancel(); throw new RangeError('Upload too large'); }
  chunks.push(part.value);
 }
 const body = new Uint8Array(size); let offset = 0;
 for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
 return body.buffer;
}
export async function proxyProfile(request: Request, path: string): Promise<Response> {
 if (!sameOrigin(request)) return Response.json({ message: 'Forbidden origin' }, { status: 403 });
 const jar = await cookies();
 const token = jar.get('backend_access')?.value;
 if (!token) return Response.json({ message: 'Sign in to continue' }, { status: 401 });
 const headers = new Headers({ Authorization: `Bearer ${token}` });
 const contentType = request.headers.get('content-type');
 if (contentType) headers.set('Content-Type', contentType);
 try {
  const body = await readBody(request);
  const response = await fetch(`${backendUrl()}/api/v1/profile${path}`, { method: request.method, headers, body, cache: 'no-store' });
  if (response.status === 401) { jar.delete('backend_access'); jar.delete('session'); }
  return new Response(response.body, { status: response.status, headers: { 'Content-Type': response.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' } });
 } catch (error) {
  if (error instanceof RangeError) return Response.json({ message: 'Picture exceeds 10 MB' }, { status: 400 });
  return Response.json({ message: 'Profile service unavailable. Please retry.' }, { status: 503 });
 }
}
