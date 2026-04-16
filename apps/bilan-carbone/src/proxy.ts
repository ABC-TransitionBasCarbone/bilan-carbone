import { Environment } from '@repo/db-common/enums'
import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

const COUNT_ROUTE = '/count'
const TILT_ROUTE = '/tilt'
const CLICKSON_ROUTE = '/clickson'
const ENV_ROUTES = [COUNT_ROUTE, TILT_ROUTE, CLICKSON_ROUTE]
const publicRoutes = ['/login', '/reset-password', '/activation', '/preview', ...ENV_ROUTES]
const assetsRoutes = ['/_next', '/img']
const RATE_LIMITED_METHODS = ['GET', 'HEAD']
const DEFAULT_PUBLIC_RATE_LIMIT_MAX_REQUESTS = 100
const DEFAULT_PUBLIC_RATE_LIMIT_WINDOW_MS = 60_000

const bucketName = process.env.SCW_BUCKET_NAME as string
const region = process.env.SCW_REGION

const scaleway = `https://${bucketName}.s3.${region}.scw.cloud`
const logos = ['https://base-empreinte.ademe.fr', 'https://www.legifrance.gouv.fr', ''].join(' ')

const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

type RateLimitResult = {
  isLimited: boolean
  retryAfterSeconds: number
}

const asPositiveInteger = (value: string | undefined, fallbackValue: number): number => {
  const parsedValue = Number(value)
  return Number.isInteger(parsedValue) && parsedValue > 0 ? parsedValue : fallbackValue
}

export const createInMemoryRateLimiter = (maxRequests: number, windowMs: number) => {
  const requestsByKey = new Map<string, { count: number; windowStart: number }>()
  let lastCleanupAt = 0

  const clearExpiredEntries = (now: number) => {
    for (const [key, entry] of requestsByKey.entries()) {
      if (now - entry.windowStart >= windowMs) {
        requestsByKey.delete(key)
      }
    }
  }

  return {
    check: (key: string, now: number = Date.now()): RateLimitResult => {
      if (now - lastCleanupAt >= windowMs) {
        clearExpiredEntries(now)
        lastCleanupAt = now
      }

      const entry = requestsByKey.get(key)
      if (!entry || now - entry.windowStart >= windowMs) {
        requestsByKey.set(key, { count: 1, windowStart: now })
        return { isLimited: false, retryAfterSeconds: 0 }
      }

      if (entry.count >= maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - entry.windowStart)) / 1000))
        return { isLimited: true, retryAfterSeconds }
      }

      entry.count += 1
      requestsByKey.set(key, entry)
      return { isLimited: false, retryAfterSeconds: 0 }
    },
  }
}

const publicRateLimitMaxRequests = asPositiveInteger(
  process.env.PUBLIC_RATE_LIMIT_MAX_REQUESTS,
  DEFAULT_PUBLIC_RATE_LIMIT_MAX_REQUESTS,
)
const publicRateLimitWindowMs = asPositiveInteger(
  process.env.PUBLIC_RATE_LIMIT_WINDOW_MS,
  DEFAULT_PUBLIC_RATE_LIMIT_WINDOW_MS,
)
const publicRouteRateLimiter = createInMemoryRateLimiter(publicRateLimitMaxRequests, publicRateLimitWindowMs)

const getClientIp = (req: NextRequest): string | null => {
  const forwardedFor = req.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  return req.ip ?? req.headers.get('x-real-ip') ?? req.headers.get('cf-connecting-ip')
}

const isPublicRoute = (pathname: string) => publicRoutes.some((route) => pathname.startsWith(route))
export const getPublicRouteScope = (pathname: string) =>
  publicRoutes.find((route) => pathname.startsWith(route)) ?? pathname

export async function proxy(req: NextRequest) {
  const host = req.headers.get('host')?.toLowerCase()
  const redirectHosts = [
    'calculator.clickson.eu',
    'www.calculator.clickson.eu',
    'pebc.bilancarbone-app.com',
    'www.bilancarbone-app.com',
  ]
  if (host && redirectHosts.includes(host)) {
    return NextResponse.redirect('https://bilancarbone-app.com/clickson', 308)
  }

  if (RATE_LIMITED_METHODS.includes(req.method) && isPublicRoute(req.nextUrl.pathname)) {
    const clientIp = getClientIp(req)
    if (clientIp) {
      const rateLimitKey = `${clientIp}:${getPublicRouteScope(req.nextUrl.pathname)}`
      const rateLimitResult = publicRouteRateLimiter.check(rateLimitKey)

      if (rateLimitResult.isLimited) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': `${rateLimitResult.retryAfterSeconds}` },
        })
      }
    }
  }

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

  const nonceRestriction = process.env.NODE_ENV === 'development' ? "'unsafe-inline' 'unsafe-eval'" : `'nonce-${nonce}'`

  const cspHeader = `
    default-src 'self';
    script-src 'self' ${nonceRestriction};
    style-src 'self' ${nonceRestriction} https://fonts.cdnfonts.com https://embed.typeform.com;
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
      source: '/((?!_next/static|_next/image|favicon.ico|images|logos|api/auth|api/schools/*|api/cron/*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
}
