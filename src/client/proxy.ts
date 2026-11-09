import { NAVIGATION_ITEMS } from '@/libs/navigation';
import { ROLE_CODES, ROLE_RULES } from '@/libs/roles';
import { decrypt } from '@/libs/session';
import { NextResponse, NextRequest } from 'next/server'


export async function proxy(request: NextRequest) {
  console.log('proxy called', request.url);

  const { pathname } = request.nextUrl;
  const rule = ROLE_RULES.find((r) => pathname.startsWith(r.prefix));
  const rawSession = request.cookies.get('session')?.value;
  const session = await decrypt(rawSession);

  if (rule) {
    if (!session) {
      console.log('No session found, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (!rule.roles.includes(session.role)) {
      console.log('User role not authorized for this route, redirecting to forbidden');
      return NextResponse.redirect(new URL('/forbiden', request.url));
    }
  }

  if (session && pathname.startsWith('/login')) {
    NAVIGATION_ITEMS[session.role].forEach((item) => {
      if (item.label === 'Dashboard') {
        console.log('User already logged in, redirecting to dashboard');
        return NextResponse.redirect(new URL(item.href, request.url));
      }
    }
    )
  }

  console.log('User authorized, proceeding to next route');
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

