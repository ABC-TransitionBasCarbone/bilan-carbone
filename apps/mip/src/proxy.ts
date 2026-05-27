import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/login']
const assetsRoutes = ['/_next', '/img']

export async function proxy(req: NextRequest) {
  if (![...publicRoutes, ...assetsRoutes].find((route) => req.nextUrl.pathname.startsWith(route))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    {
      source: '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
