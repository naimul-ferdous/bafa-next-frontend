import { NextRequest, NextResponse } from 'next/server';

const TOKEN_KEY = 'bafa_token_stored_credential';
const AUTH_PAGES = ['/signin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;

  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  // Already logged in — block access to auth pages and redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/signin'],
};
