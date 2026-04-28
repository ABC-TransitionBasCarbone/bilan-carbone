import { checkCronRequest } from '@/app/api/cron/utils'
import { getUsersFromFTP } from '@/scripts/ftp/importUsers'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest): Promise<Response> {
  const error = checkCronRequest(req, 'import-users')
  if (error) {
    return error
  }

  try {
    await getUsersFromFTP()
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Error in import-users cron:', error)
    return new Response('Import users failed', { status: 500 })
  }
}
