import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Simple check for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Add custom headers or basic protection
    const response = NextResponse.next();
    response.headers.set('X-Kanban-Version', '1.0.0-mvp');
    return response;
  }
}

export const config = {
  matcher: '/api/:path*',
};
