import { NextRequest } from 'next/server'

const lastRunTimes = new Map<string, number>()
const RATE_LIMIT_MS = 60000 * 8 // 8 minutes

export const checkCronRequest = (req: NextRequest, cronName: string): Response | null => {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const lastRun = lastRunTimes.get(cronName)
  const now = Date.now()
  if (lastRun && now - lastRun < RATE_LIMIT_MS) {
    return new Response('Too Many Requests', { status: 429 })
  }
  lastRunTimes.set(cronName, now)

  return null
}
