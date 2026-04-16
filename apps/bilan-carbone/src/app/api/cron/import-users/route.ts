import { checkCronRequest } from '@/app/api/cron/utils'
import { getUsersFromFTP } from '@/scripts/ftp/importUsers'
import type { NextRequest } from 'next/server'

const createResponse = (body: string, status: number): Response => {
  if (typeof Response !== 'undefined') {
    return new Response(body, { status })
  }
  return {
    status,
    text: async () => body,
  } as Response
}

export async function POST(req: NextRequest) {
  const error = checkCronRequest(req, 'import-users')
  if (error) {
    return error
  }

  try {
    await getUsersFromFTP()
    return createResponse('OK', 200)
  } catch (error) {
    console.error('Error in import-users cron:', error)
    return createResponse('Import users failed', 500)
  }
}
