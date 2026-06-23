import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';

const GUEST_ROUTES = ['/home', '/gifts', '/gallery'];
const ADMIN_ROUTES = ['/admin'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isGuestRoute = GUEST_ROUTES.some((r) => pathname.startsWith(r));
  const isProtectedAdmin =
    ADMIN_ROUTES.some((r) => pathname.startsWith(r)) &&
    pathname !== '/admin/login';

  if (!isGuestRoute && !isProtectedAdmin) return NextResponse.next();

  const sealed = req.cookies.get(sessionOptions.cookieName)?.value;
  let session: Partial<SessionData> = {};

  if (sealed) {
    try {
      session = await unsealData<SessionData>(sealed, {
        password: sessionOptions.password as string,
      });
    } catch {
      // invalid / tampered cookie — treat as unauthenticated
    }
  }

  if (isGuestRoute && !session.access) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (isProtectedAdmin && !session.isAdmin) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/gifts/:path*', '/gallery/:path*', '/admin/:path*'],
};
