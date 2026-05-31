// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // ✅ 1. დავუშვათ ყველა API endpoint (მათ შორის cron და debug)
  if (path.startsWith('/api/')) {
    console.log(`🔓 Middleware: Allowing API access to ${path}`)
    return NextResponse.next()
  }

  // ✅ 2. დავუშვათ სტატიკური ფაილები
  if (
    path.startsWith('/_next') ||
    path.includes('favicon.ico') ||
    path.includes('.png') ||
    path.includes('.jpg')
  ) {
    return NextResponse.next()
  }

  // ყველა სხვა გვერდი (დაშბორდი, ლოგინი) ნორმალურად გააგრძელოს
  return NextResponse.next()
}

export const config = {
  matcher: [
    // გამოვიყენოთ ფართო მატჩერი რომ ყველაფერი დავიჭიროთ
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}