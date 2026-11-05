import type { CourseSessionTrainee } from '@/db/courseSession'
import { AttendanceStatus } from '@abc-transitionbascarbone/common/db/enums'

export const getInitialAttendanceSelection = (
  trainees: Pick<CourseSessionTrainee, 'organizationVersionId' | 'attendance'>[],
) => {
  const hasAttendance = trainees.some(({ attendance }) => attendance !== null)
  return [
    ...new Set(
      trainees.flatMap(({ organizationVersionId, attendance }) =>
        organizationVersionId && (!hasAttendance || attendance?.status === AttendanceStatus.PRESENT)
          ? [organizationVersionId]
          : [],
      ),
    ),
  ]
}
