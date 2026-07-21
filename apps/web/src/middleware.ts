import { type NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest): NextResponse {
  const token = req.cookies.get('synapse_token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/queue/:path*', '/knowledge/:path*'],
};
