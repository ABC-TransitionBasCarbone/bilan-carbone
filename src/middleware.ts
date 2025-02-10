import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const publicRoutes = ['/login', '/reset-password', '/activation']

export async function middleware(req: NextRequest) {
  if (!publicRoutes.find((route) => req.nextUrl.pathname.startsWith(route))) {
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
    // Appliquer le middleware uniquement sur les routes spécifiées
    '/((?!_next/static|_next/image|favicon.ico|images|logos|api/auth).*)',
  ],
}
