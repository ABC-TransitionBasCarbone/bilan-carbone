import { checkCronRequest } from '@/app/api/cron/utils'
import { getUsersFromFTP } from '@/scripts/ftp/importUsers'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const error = checkCronRequest(req, 'import-users')
  if (error) {
    return error
  }

  await getUsersFromFTP()
  return new Response('OK', { status: 200 })
}
