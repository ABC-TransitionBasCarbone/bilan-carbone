'use server'

import {
  getCourseSessionForProfessor,
  getCourseSessionStudies,
  getCourseSessionTrainees,
  removeCourseSessionTrainee,
} from '@/db/courseSession'
import { canManageCourseSession } from '@/services/permissions/courseSession'
import { withServerResponse } from '@/utils/serverResponse'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'
import { revalidatePath } from 'next/cache'
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

export const getProfessorCourseSessionTrainees = async (courseSessionId: string) =>
  withServerResponse('getProfessorCourseSessionTrainees', async () => {
    const session = await dbActualizedAuth()
    const account = session?.user
    if (!account || !(await canManageCourseSession(account, courseSessionId))) {
      console.error('getProfessorCourseSessionTrainees: user not authorized', {
        accountId: account?.accountId,
        courseSessionId,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    return getCourseSessionTrainees(courseSessionId, account.environment)
  })

export const deleteCourseSessionTrainee = async (courseSessionId: string, organizationVersionId: string) =>
  withServerResponse('deleteCourseSessionTrainee', async () => {
    const session = await dbActualizedAuth()
    const account = session?.user
    if (!account?.organizationVersionId || !(await canManageCourseSession(account, courseSessionId))) {
      console.error('deleteCourseSessionTrainee: user not authorized', {
        accountId: account?.accountId,
        courseSessionId,
        organizationVersionId,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    const result = await removeCourseSessionTrainee(
      courseSessionId,
      organizationVersionId,
      account.organizationVersionId,
      account.environment,
    )
    if (!result.count) {
      console.error('deleteCourseSessionTrainee: enrollment not found or not authorized', {
        accountId: account.accountId,
        courseSessionId,
        organizationVersionId,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    revalidatePath(`/sessions/${courseSessionId}`)
    revalidatePath(`/sessions/${courseSessionId}/formees`)
  })
