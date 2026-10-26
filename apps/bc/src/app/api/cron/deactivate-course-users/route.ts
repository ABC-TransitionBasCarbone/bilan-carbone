import { checkCronRequest } from '@/app/api/cron/utils'
import { deactivateExpiredCourseUsers } from '@/services/training'
import { NextResponse, type NextRequest } from 'next/server'

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const error = checkCronRequest(req, 'deactivate-course-users')
  if (error) {
    return error
  }

  try {
    const result = await deactivateExpiredCourseUsers()
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error in deactivate-course-users cron:', error)
    return new NextResponse('Course user deactivation failed', { status: 500 })
  }
}
