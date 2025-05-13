import { getToken } from 'next-auth/jwt'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const publicRoutes = ['/login', '/reset-password', '/activation']

const bucketName = process.env.SCW_BUCKET_NAME as string
const region = process.env.SCW_REGION

const scaleway = `https://${bucketName}.s3.${region}.scw.cloud`
const logos = ['https://base-empreinte.ademe.fr', 'https://www.legifrance.gouv.fr', ''].join(' ')

const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

export async function middleware(req: NextRequest) {
  if (!publicRoutes.find((route) => req.nextUrl.pathname.startsWith(route))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      const loginUrl = new URL('/login', req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}' https://fonts.cdnfonts.com;
    img-src 'self' data: ${logos};
    font-src 'self' https://fonts.cdnfonts.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
		frame-src ${scaleway} https://www.youtube.com
	`
  const contentSecurityPolicyHeader = cspHeader.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeader)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeader)

  return response
}

export const config = {
  matcher: [
    {
      // Appliquer le middleware uniquement sur les routes spécifiées
      source: '/((?!_next/static|_next/image|favicon.ico|images|logos|api/auth).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
