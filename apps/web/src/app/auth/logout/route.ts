import { type NextRequest, NextResponse } from 'next/server';

export function POST(req: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL('/', req.url));
  response.cookies.set('synapse_token', '', { maxAge: 0, path: '/' });
  return response;
}
