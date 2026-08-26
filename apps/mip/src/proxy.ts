import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const publicRoutes = ['/login', '/reset-password', '/activation', '/register']
const assetsRoutes = ['/_next', '/img', '/.well-known']

const normalizePathname = (pathname: string) => {
  const pathnameWithoutTrailingSlash = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname
  const pathnameWithoutLocalePrefix = pathnameWithoutTrailingSlash.replace(/^\/(?:fr|en)(?=\/|$)/, '')

  return pathnameWithoutLocalePrefix || '/'
}

const isDynamicPublicRoute = (pathname: string) => {
  return /^\/[^/]+\/(survey|results)$/.test(pathname)
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const normalizedPathname = normalizePathname(pathname)
  const isPublicRoute = [...publicRoutes, ...assetsRoutes].some((route) => normalizedPathname.startsWith(route))
  const isDynamicRoute = isDynamicPublicRoute(normalizedPathname)

  if (!isPublicRoute && !isDynamicRoute) {
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
