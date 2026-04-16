import { checkCronRequest } from '@/app/api/cron/utils'
import { getUsersFromFTP } from '@/scripts/ftp/importUsers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const error = checkCronRequest(req, 'import-users')
  if (error) {
    return error
  }

  try {
    await getUsersFromFTP()
    return new NextResponse('OK', { status: 200 })
  } catch (error) {
    console.error('Error in import-users cron:', error)
    return new NextResponse('Import users failed', { status: 500 })
  }
}
