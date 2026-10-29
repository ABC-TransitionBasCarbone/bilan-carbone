import { checkCronRequest } from '@/app/api/cron/utils'
import { importCourseSessionsFromFTP } from '@/scripts/ftp/importTrainingSessions/importTrainingSessions'
import { NextResponse, type NextRequest } from 'next/server'

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const error = checkCronRequest(req, 'import-training-sessions')
  if (error) {
    return error
  }

  try {
    const result = await importCourseSessionsFromFTP()
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error in import-training-sessions cron:', error)
    return new NextResponse('Import training sessions failed', { status: 500 })
  }
}
