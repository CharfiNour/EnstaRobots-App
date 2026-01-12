import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Get session from cookie or header (for now, we'll skip server-side auth check)
    // In production, you'd validate the session here

    // Protected routes
    const teamRoutes = pathname.startsWith('/team');
    const judgeRoutes = pathname.startsWith('/jury');
    const adminRoutes = pathname.startsWith('/admin');

    // For now, allow all routes (auth is handled client-side)
    // In production, implement proper server-side session validation

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
