import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CSRF protection toggle: set CSRF_DISABLED=true in .env.local to disable validation
const CSRF_COOKIE = 'csrf_token';
const DISABLED = process.env.CSRF_DISABLED === 'true';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const EXEMPT_PATHS = [
  '/_next', '/favicon.ico', '/api/health', '/api/webhooks', '/api/auth', '/api/migrate',
];

function isExempt(pathname: string) {
  return EXEMPT_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const res = NextResponse.next();

  // 1) Ensure CSRF cookie (readable by client, double-submit pattern)
  if (!req.cookies.get(CSRF_COOKIE)) {
    // @ts-ignore - crypto global exists
    const token = (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2));
    res.cookies.set(CSRF_COOKIE, token, {
      httpOnly: false, // must be readable by client
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  // 2) Validate only write methods and non-exempt paths
  if (!DISABLED && !SAFE_METHODS.has(req.method) && !isExempt(pathname)) {
    const header = req.headers.get('x-csrf-token');
    const cookie = req.cookies.get(CSRF_COOKIE)?.value;
    if (!header || !cookie || header !== cookie) {
      return NextResponse.json({ error: 'CSRF token validation failed' }, { status: 403 });
    }
  }

  // 3) For now, we skip auth handling in middleware and let individual routes handle it
  // This ensures public routes like /login are always accessible
  return res
}

// Run middleware on everything except static assets handled separately by Next.js
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
