import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // ✅ დავუშვათ Cron API Auth-ის გარეშე
  if (request.nextUrl.pathname.startsWith('/api/cron')) {
    return NextResponse.next()
  }

  // ყველა სხვა request გააგრძელოს ნორმალურად
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}