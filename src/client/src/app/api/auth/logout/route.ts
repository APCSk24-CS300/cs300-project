import { cookies } from 'next/headers';
import { sameOrigin } from '@/libs/backend-session';
export async function POST(request: Request) {
 if (!sameOrigin(request)) return Response.json({ message: 'Forbidden origin' }, { status: 403 });
 const jar = await cookies(); jar.delete('session'); jar.delete('backend_access');
 return new Response(null, { status: 204 });
}
