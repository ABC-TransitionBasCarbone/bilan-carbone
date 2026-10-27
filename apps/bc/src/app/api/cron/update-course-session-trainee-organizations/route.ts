import { checkCronRequest } from '@/app/api/cron/utils'
import { updateCourseSessionTraineeOrganizationStatuses } from '@/services/courseSessionTraineeOrganization'
import { NextResponse, type NextRequest } from 'next/server'

export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const error = checkCronRequest(req, 'update-course-session-trainee-organizations')
  if (error) {
    return error
  }

  try {
    const result = await updateCourseSessionTraineeOrganizationStatuses()
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('Error in update-course-session-trainee-organizations cron:', error)
    return new NextResponse('Updating course session trainee organizations failed', { status: 500 })
  }
}
