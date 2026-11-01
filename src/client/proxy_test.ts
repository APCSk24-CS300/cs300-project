import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


// marked `async` if `await` inside
export function proxy(request: NextRequest) {
   // how to redirect to '/' if the user is not logged in
    
   
  return NextResponse.redirect(new URL('/home', request.url))
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
  };

