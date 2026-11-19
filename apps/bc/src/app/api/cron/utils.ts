import { NextRequest, NextResponse } from 'next/server'

const lastRunTimes = new Map<string, number>()
const RATE_LIMIT_MS = 60000 * 8 // 8 minutes

export const checkCronRequest = (req: NextRequest, cronName: string): NextResponse | null => {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('checkCronRequest: CRON_SECRET is not configured', { cronName })
    return new NextResponse('Unauthorized', { status: 401 })
  }
  if (authHeader !== `Bearer ${secret}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const lastRun = lastRunTimes.get(cronName)
  const now = Date.now()
  if (lastRun && now - lastRun < RATE_LIMIT_MS) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }
  lastRunTimes.set(cronName, now)

  return null
}
