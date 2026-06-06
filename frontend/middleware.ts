import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const authRaw = request.cookies.get('psiclinica-auth')?.value;
  let hasToken = false;

  if (authRaw) {
    try {
      const auth = JSON.parse(decodeURIComponent(authRaw)) as { state?: { accessToken?: string } };
      hasToken = !!auth?.state?.accessToken;
    } catch {
      hasToken = false;
    }
  }

  if (!hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
