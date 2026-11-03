'use server'

import { getCourseSessionForProfessor, getCourseSessionStudies } from '@/db/courseSession'
import { withServerResponse } from '@/utils/serverResponse'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'
import { dbActualizedAuth } from '../auth'

export const getProfessorCourseSession = async (id: string) =>
  withServerResponse('getProfessorCourseSession', async () => {
    const session = await dbActualizedAuth()
    const account = session?.user
    if (!account?.organizationVersionId || !isCourseEnvironment(account.environment)) {
      console.error('getProfessorCourseSession: user not authorized', {
        accountId: account?.accountId,
        courseSessionId: id,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    const courseSession = await getCourseSessionForProfessor(account.organizationVersionId, account.environment, id)
    if (!courseSession) {
      return null
    }

    const studies = await getCourseSessionStudies(courseSession, account.organizationVersionId, account.environment)
    return { ...courseSession, studies }
  })
