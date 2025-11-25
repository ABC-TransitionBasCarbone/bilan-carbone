import { Environment } from '@prisma/client'
import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const COUNT_ROUTE = '/count'
const TILT_ROUTE = '/tilt'
const CLICKSON_ROUTE = '/clickson'
const ENV_ROUTES = [COUNT_ROUTE, TILT_ROUTE, CLICKSON_ROUTE]
const publicRoutes = ['/login', '/reset-password', '/activation', '/preview', ...ENV_ROUTES]
const assetsRoutes = ['/_next', '/img']

const bucketName = process.env.SCW_BUCKET_NAME as string
const region = process.env.SCW_REGION

const scaleway = `https://${bucketName}.s3.${region}.scw.cloud`
const logos = ['https://base-empreinte.ademe.fr', 'https://www.legifrance.gouv.fr', ''].join(' ')

const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

export async function middleware(req: NextRequest) {
  if (ENV_ROUTES.includes(req.nextUrl.pathname)) {
    const countLoginUrl = new URL(`${req.nextUrl}/login`, req.url)
    return NextResponse.redirect(countLoginUrl)
  }

  if (![...publicRoutes, ...assetsRoutes].find((route) => req.nextUrl.pathname.startsWith(route))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
      const env = req.nextUrl.searchParams.get('env')
      let baseUrl = ''
      switch (env) {
        case Environment.CUT:
          baseUrl = `${COUNT_ROUTE}`
          break
        case Environment.TILT:
          baseUrl = `${TILT_ROUTE}`
          break
        case Environment.CLICKSON:
          baseUrl = `${CLICKSON_ROUTE}`
          break
        default:
          break
      }

      const loginUrl = new URL(`${baseUrl}/login`, req.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}' https://fonts.cdnfonts.com https://embed.typeform.com;
    img-src 'self' data: ${logos};
    font-src 'self' https://fonts.cdnfonts.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' ${scaleway} https://www.youtube.com https://form.typeform.com;
    connect-src 'self' ${scaleway} https://api.typeform.com;
  `
  const contentSecurityPolicyHeader = cspHeader.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeader)
  requestHeaders.set('x-url', req.url)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeader)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  return response
}

export const config = {
  matcher: [
    {
      // Appliquer le middleware uniquement sur les routes spécifiées
      source: '/((?!_next/static|_next/image|favicon.ico|images|logos|api/auth|api/schools/*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
