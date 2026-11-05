'use server'

import {
  getCourseSessionForProfessor,
  getCourseSessionStudies,
  getCourseSessionTrainees,
  registerCourseSessionTrainee,
  removeCourseSessionTrainee,
  saveCourseSessionAttendance,
} from '@/db/courseSession'
import { canAddCourseSessionTrainee, canManageCourseSession } from '@/services/permissions/courseSession'
import { withServerResponse } from '@/utils/serverResponse'
import { NOT_AUTHORIZED } from '@abc-transitionbascarbone/common/services/permissions/check'
import { isCourseEnvironment } from '@abc-transitionbascarbone/common/utils/environments'
import { revalidatePath } from 'next/cache'
import { dbActualizedAuth } from '../auth'
import {
  AddCourseSessionTraineeCommand,
  AddCourseSessionTraineeCommandValidation,
  SaveCourseSessionAttendanceCommand,
  SaveCourseSessionAttendanceCommandValidation,
} from './courseSession.command'

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

export const getCourseSessionDetails = async (courseSessionId: string) =>
  withServerResponse('getCourseSessionDetails', async () => {
    const session = await dbActualizedAuth()
    const account = session?.user
    if (!account?.organizationVersionId || !(await canManageCourseSession(account, courseSessionId))) {
      console.error('getCourseSessionDetails: user not authorized', {
        accountId: account?.accountId,
        courseSessionId,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    const courseSession = await getCourseSessionForProfessor(
      account.organizationVersionId,
      account.environment,
      courseSessionId,
    )
    if (!courseSession) {
      console.error('getCourseSessionDetails: session no longer available', { courseSessionId })
      throw new Error(NOT_AUTHORIZED)
    }

    return courseSession
  })

export const getProfessorCourseSessionTrainees = async (courseSessionId: string) =>
  withServerResponse('getProfessorCourseSessionTrainees', async () => {
    const session = await dbActualizedAuth()
    const account = session?.user
    if (!account?.organizationVersionId || !(await canManageCourseSession(account, courseSessionId))) {
      console.error('getProfessorCourseSessionTrainees: user not authorized', {
        accountId: account?.accountId,
        courseSessionId,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    return getCourseSessionTrainees(courseSessionId, account.environment)
  })

export const updateCourseSessionAttendance = async (
  courseSessionId: string,
  input: SaveCourseSessionAttendanceCommand,
) =>
  withServerResponse('updateCourseSessionAttendance', async () => {
    const session = await dbActualizedAuth()
    const account = session?.user
    if (!account?.organizationVersionId || !(await canManageCourseSession(account, courseSessionId))) {
      console.error('updateCourseSessionAttendance: user not authorized', {
        accountId: account?.accountId,
        courseSessionId,
      })
      throw new Error(NOT_AUTHORIZED)
    }
    const command = SaveCourseSessionAttendanceCommandValidation.parse(input)
    await saveCourseSessionAttendance(
      courseSessionId,
      account.organizationVersionId,
      account.environment,
      command.organizationVersionIds,
    )
    revalidatePath(`/sessions/${courseSessionId}/formees`)
  })

export const addCourseSessionTrainee = async (courseSessionId: string, input: AddCourseSessionTraineeCommand) =>
  withServerResponse('addCourseSessionTrainee', async () => {
    const session = await dbActualizedAuth()
    const account = session?.user
    if (!account?.organizationVersionId || !(await canAddCourseSessionTrainee(account, courseSessionId))) {
      console.error('addCourseSessionTrainee: user not authorized', {
        accountId: account?.accountId,
        courseSessionId,
      })
      throw new Error(NOT_AUTHORIZED)
    }

    const trainee = AddCourseSessionTraineeCommandValidation.parse(input)
    const result = await registerCourseSessionTrainee(
      courseSessionId,
      account.organizationVersionId,
      account.environment,
      trainee,
    )
    if (result.status !== 'confirmationRequired') {
      for (const id of [courseSessionId, ...result.previousSessionIds]) {
        revalidatePath(`/sessions/${id}`)
        revalidatePath(`/sessions/${id}/formees`)
      }
    }
    return result
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
