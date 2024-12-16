import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  try {
    const supabase = createMiddlewareClient({ req: request, res });
    const { data: { session } } = await supabase.auth.getSession();
    const pathname = request.nextUrl.pathname;

    // Skip auth check for public routes
    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api/') ||
      pathname.includes('.')
    ) {
      return res;
    }

    // Redirect authenticated users away from auth pages
    if (pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/dashboard/aiassistant', request.url));
    }

    // Protect dashboard routes
    if ((pathname === '/' || pathname.startsWith('/dashboard')) && !session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};