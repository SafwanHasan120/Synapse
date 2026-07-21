import { type NextRequest, NextResponse } from 'next/server';

export function GET(req: NextRequest): NextResponse {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/?error=no_token', req.url));
  }

  const response = NextResponse.redirect(new URL('/queue', req.url));
  response.cookies.set('synapse_token', token, {
    httpOnly: true,
    secure:   process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 7,
  });

  return response;
}
