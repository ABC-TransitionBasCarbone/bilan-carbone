import { isAdminOnOrga, type CourseAccess } from '@/utils/organization'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'
import { UserSession } from 'next-auth'

export const isAdminOnStudyOrga = (
  user: Pick<UserSession, 'role' | 'organizationVersionId'>,
  studyOrganizationVersion: {
    id: string
    parentId: string | null
  },
) => isAdminOnOrga(user, studyOrganizationVersion)

export const canShareStudyCorrection = (
  user: Pick<UserSession, 'environment' | 'organizationVersionId'>,
  study: {
    organizationVersion: { environment: Environment; parentId: string | null; parent: CourseAccess | null }
  },
) => {
  const isProfessor =
    isCourseEnvironment(user.environment) && !!study.organizationVersion.parent?.professorCourseSessions?.length
  const isStudyFromRightEnvAndOrga =
    study.organizationVersion.environment === user.environment &&
    study.organizationVersion.parentId === user.organizationVersionId

  return isProfessor && isStudyFromRightEnvAndOrga
}
