import { proxyProfile } from '@/libs/backend-session';
type Context = { params: Promise<{ segments?: string[] }> };
async function handle(request: Request, context: Context) {
 const { segments = [] } = await context.params;
 const path = segments.join('/');
 const allowed = ['', 'password', 'avatar'].includes(path) ||
  (segments.length === 3 && segments[0] === 'avatar' && segments[1] === 'files');
 if (!allowed) return Response.json({ message: 'Not found' }, { status: 404 });
 return proxyProfile(request, path ? `/${path}` : '');
}
export { handle as GET, handle as PATCH, handle as POST, handle as DELETE };
