import { checkCronRequest } from '@/app/api/cron/utils'
import { handleTrainingSessionsFromFTP } from '@/scripts/ftp/importTrainingSessions'
import { NextResponse, type NextRequest } from 'next/server'

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const error = checkCronRequest(req, 'import-training-sessions')
  if (error) {
    return error
  }

  try {
    const errors = await handleTrainingSessionsFromFTP()
    return NextResponse.json({ success: errors.length === 0, errors }, { status: errors.length > 0 ? 500 : 200 })
  } catch (error) {
    console.error('Error in import-training-sessions cron:', error)
    return new NextResponse('Import training sessions failed', { status: 500 })
  }
}
