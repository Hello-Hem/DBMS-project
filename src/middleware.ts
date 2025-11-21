import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/packages',
      '/packages/[id]',
      '/search',
      '/login',
      '/register',
      '/api/auth/[...nextauth]',
      '/api/packages',
      '/api/packages/[id]',
    ];

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(route => {
      if (route.includes('[') && route.includes(']')) {
        // Handle dynamic routes
        const baseRoute = route.split('[')[0];
        return pathname.startsWith(baseRoute);
      }
      return pathname === route;
    });

    if (isPublicRoute) {
      return NextResponse.next();
    }

    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based route protection
    const userRole = token.role as string;

    // Customer routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/booking')) {
      if (userRole !== 'customer') {
        const redirectUrl = getRedirectUrl(userRole);
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }

    // Agent routes
    if (pathname.startsWith('/agent')) {
      if (userRole !== 'agent' && userRole !== 'admin') {
        const redirectUrl = getRedirectUrl(userRole);
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }

    // Admin routes
    if (pathname.startsWith('/admin')) {
      if (userRole !== 'admin') {
        const redirectUrl = getRedirectUrl(userRole);
        return NextResponse.redirect(new URL(redirectUrl, req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // Only check if token exists
    },
  }
);

function getRedirectUrl(role: string): string {
  switch (role) {
    case 'customer':
      return '/dashboard';
    case 'agent':
      return '/agent/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};