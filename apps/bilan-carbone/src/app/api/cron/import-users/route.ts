import { checkCronRequest } from '@/app/api/cron/utils'
import { getUsersFromFTP } from '@/scripts/ftp/importUsers'
import type { NextRequest } from 'next/server'
import { Response as UndiciResponse } from 'undici'

const createResponse = (body: string, status: number): Response => {
  const ResponseConstructor = typeof Response !== 'undefined' ? Response : UndiciResponse
  return new ResponseConstructor(body, { status })
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
