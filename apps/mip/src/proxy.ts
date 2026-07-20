import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/login', '/reset-password', '/activation', '/register']
const assetsRoutes = ['/_next', '/img']

const isDynamicPublicRoute = (pathname: string) => /^\/[^/]+\/(survey|results)\/?$/.test(pathname)

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublicRoute = [...publicRoutes, ...assetsRoutes].some((route) => pathname.startsWith(route))

  if (!isPublicRoute && !isDynamicPublicRoute(pathname)) {
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
      source: '/((?!_next/static|_next/image|favicon.ico|images|logos|api/auth).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
