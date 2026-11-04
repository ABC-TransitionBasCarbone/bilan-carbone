import { prismaClient } from '@/db/client.server'
import { createCourseParticipantAccounts, prepareCourseSessionTraineeRegistrations } from '@/db/courseSession'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import {
  sendCourseSessionsCreatedEmail,
  type TrainingSessionUpdate,
} from '@abc-transitionbascarbone/common/services/email/email'
import { Client } from 'basic-ftp'
import { randomInt, randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import { downloadFileFromFTP, getFTPClient } from '../utils'
import { parseCourseSessionWorkbook } from './importTrainingSessionsParsing'
import { CourseSessionImport } from './importTrainingSessionsType'
import {
  getProfessor,
  getTrainees,
  SavedCourseSession,
  sessionsSelect,
  shouldImportCourseSessionTrainee,
} from './importTrainingSessionsUtils'

const getSessionUpdate = (before: SavedCourseSession, after: SavedCourseSession): TrainingSessionUpdate | null => {
  const dates: TrainingSessionUpdate['dates'] = []
  if (before.startDate.getTime() !== after.startDate.getTime()) {
    dates.push({ label: 'Date de début', before: before.startDate, after: after.startDate })
  }
  if (before.endDate.getTime() !== after.endDate.getTime()) {
    dates.push({ label: 'Date de fin', before: before.endDate, after: after.endDate })
  }
  const previousTrainees = getTrainees(before)
  const currentTrainees = getTrainees(after)
  const previousEmails = new Set(previousTrainees.map(({ email }) => email))
  const currentEmails = new Set(currentTrainees.map(({ email }) => email))
  const addedTrainees = currentTrainees.filter(({ email }) => !previousEmails.has(email))
  const removedTrainees = previousTrainees.filter(({ email }) => !currentEmails.has(email))
  const previousProfessor = getProfessor(before)
  const currentProfessor = getProfessor(after)
  const professor =
    previousProfessor?.email !== currentProfessor?.email ? { before: previousProfessor, after: currentProfessor } : null
  if (!dates.length && !professor && !addedTrainees.length && !removedTrainees.length) {
    return null
  }
  return {
    name: after.name,
    environment: after.environment,
    startDate: after.startDate,
    courseOrganismId: after.courseOrganismId,
    dates,
    professor,
    addedTrainees,
    removedTrainees,
  }
}

const getInfoFromLocal = async (organisms: { id: string }[]) => {
  const localFilePath = path.resolve(process.cwd(), 'sessions_a_importer.xlsx')
  const data = await fs.promises.readFile(localFilePath)
  const imports = parseCourseSessionWorkbook(data, organisms[0].id)
  return imports
}

export const getCourseSessionsFromFTP = async (): Promise<CourseSessionImport> => {
  let client: Client | undefined
  try {
    const organisms = await prismaClient.courseOrganism.findMany()
    if (organisms.length === 0) {
      return { sessions: [], deletions: [] }
    }

    if (process.env.NODE_ENV === 'development') {
      return getInfoFromLocal(organisms)
    }

    client = await getFTPClient()
    const folderPath = process.env.FTP_TRAINING_SESSIONS_FILE_PATH || '/'
    const fileName = process.env.FTP_TRAINING_SESSIONS_FILE_NAME
    if (!fileName) {
      console.error('FTP_TRAINING_SESSIONS_FILE_NAME is not configured')
      return { sessions: [], deletions: [] }
    }

    const result: CourseSessionImport = { sessions: [], deletions: [] }
    for (const organism of organisms) {
      const fullPath = path.posix.join(folderPath, organism.ftpPath, fileName)
      const data = await downloadFileFromFTP(client, fullPath, fileName)
      const { sessions, deletions } = parseCourseSessionWorkbook(data, organism.id)
      result.sessions.push(...sessions)
      result.deletions.push(...deletions)
    }

    console.log('Training sessions file read successfully')
    return result
  } catch (error) {
    console.error('Error reading training sessions file:', error)
    throw error
  } finally {
    client?.close()
  }
}

const getOrganizationVersionId = (
  accounts: {
    organizationVersionId: string | null
    environment: Environment
    user: { email: string }
  }[],
  email: string,
  environment: Environment,
) => {
  const organizationVersionId = accounts.find(
    ({ user, environment: accountEnvironment }) => user.email === email && accountEnvironment === environment,
  )?.organizationVersionId
  if (!organizationVersionId) {
    throw new Error(`Missing organization version for course participant ${email}`)
  }
  return organizationVersionId
}

export const importCourseSessionsFromFTP = async () => {
  const { sessions, deletions } = await getCourseSessionsFromFTP()

  if (sessions.length === 0 && deletions.length === 0) {
    return {
      importedSessions: 0,
      modifiedSessions: 0,
      createdUsers: 0,
      createdAccounts: 0,
      addedTrainees: 0,
      addedProfessors: 0,
      deletedSessions: 0,
      deletedTrainees: 0,
      deletedProfessors: 0,
    }
  }

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const notFinishedSessions = sessions.filter(({ endDate }) => endDate >= today)

  const userAccountInSession = notFinishedSessions.flatMap(({ trainees, professor, environment }) =>
    [...trainees, ...(professor ? [professor] : [])].map((participant) => ({ ...participant, environment })),
  )

  const {
    newUsers,
    newAccounts,
    accounts: accountsWithOrganizationVersions,
  } = await prismaClient.$transaction((transaction) =>
    createCourseParticipantAccounts(userAccountInSession, transaction),
  )

  const affectedSessionsSQLRequest: Prisma.CourseSessionWhereInput[] = [
    ...notFinishedSessions.flatMap(({ courseOrganismId, name, environment, type, trainees }) => [
      { courseOrganismId, type, name, environment },
      ...(trainees.length > 0
        ? [
            {
              type,
              environment,
              traineeOrganizations: {
                some: {
                  organizationVersion: {
                    userAccounts: { some: { user: { email: { in: trainees.map(({ email }) => email) } } } },
                  },
                },
              },
            },
          ]
        : []),
    ]),
    ...deletions.map(({ courseOrganismId, name }) => ({ courseOrganismId, name })),
  ]
  const deletedCounts = { deletedSessions: 0, deletedTrainees: 0, deletedProfessors: 0 }
  const existingSessions = await prismaClient.courseSession.findMany({
    where: {
      OR: affectedSessionsSQLRequest,
    },
    select: sessionsSelect,
  })
  const importedSessions = await prismaClient.$transaction(
    async (transaction) => {
      const removals = await transaction.courseSessionTraineeRemoval.findMany({
        where: { courseSessionId: { in: existingSessions.map(({ id }) => id) } },
        select: { courseSessionId: true, organizationVersionId: true, removedAt: true },
      })
      const sessionsToImport = notFinishedSessions.map((session) => {
        const previous = existingSessions.find(
          ({ courseOrganismId, name, environment }) =>
            courseOrganismId === session.courseOrganismId &&
            name === session.name &&
            environment === session.environment,
        )
        const removedAtByOrganization = new Map(
          removals
            .filter(({ courseSessionId }) => courseSessionId === previous?.id)
            .map(({ organizationVersionId, removedAt }) => [organizationVersionId, removedAt]),
        )
        return {
          ...session,
          trainees: session.trainees.filter(({ email, OfUpdatedAt }) =>
            shouldImportCourseSessionTrainee(
              OfUpdatedAt,
              removedAtByOrganization.get(
                getOrganizationVersionId(accountsWithOrganizationVersions, email, session.environment),
              ),
              session.endDate,
            ),
          ),
        }
      })
      for (const deletion of deletions) {
        const where = { courseOrganismId: deletion.courseOrganismId, name: deletion.name }
        if (deletion.type === 'session') {
          deletedCounts.deletedSessions += (await transaction.courseSession.deleteMany({ where })).count
        } else if (deletion.type === 'stagiaire') {
          deletedCounts.deletedTrainees += (
            await transaction.courseSessionTraineeOrganization.deleteMany({
              where: {
                courseSession: where,
                organizationVersion: { userAccounts: { some: { user: { email: deletion.email } } } },
              },
            })
          ).count
        } else {
          deletedCounts.deletedProfessors += (
            await transaction.courseSession.updateMany({
              where: {
                ...where,
                professorOrganization: { userAccounts: { some: { user: { email: deletion.email } } } },
              },
              data: { professorOrganizationVersionId: null },
            })
          ).count
        }
      }
      let hasTransferredTrainees = false
      const importedSessionsPromises = []
      for (const session of sessionsToImport) {
        const professorOrganizationVersionId = session.professor
          ? getOrganizationVersionId(accountsWithOrganizationVersions, session.professor.email, session.environment)
          : null
        const traineeOrganizationVersionIds = session.trainees.map(({ email }) =>
          getOrganizationVersionId(accountsWithOrganizationVersions, email, session.environment),
        )
        const previous = existingSessions.find(
          ({ courseOrganismId, name, environment }) =>
            courseOrganismId === session.courseOrganismId &&
            name === session.name &&
            environment === session.environment,
        )
        const courseSessionId = previous?.id ?? randomUUID()
        const prepared = await prepareCourseSessionTraineeRegistrations(
          { ...session, id: courseSessionId },
          traineeOrganizationVersionIds,
          transaction,
          { source: 'ftp' },
        )
        deletedCounts.deletedTrainees += prepared.removedCount
        hasTransferredTrainees ||= prepared.removedCount > 0

        let code = randomInt(99999999).toString()

        let existingCodes = [{}]
        let count = 0
        while (existingCodes.length > 0 && count < 10) {
          code = randomInt(99999999).toString()

          existingCodes = await transaction.courseSession.findMany({
            where: { OR: [{ code }] },
          })

          count++
        }

        if (count >= 10 && existingCodes.length > 0) {
          throw new Error('Failed to generate unique session codes after 10 attempts')
        }

        importedSessionsPromises.push(
          await transaction.courseSession.upsert({
            where: {
              courseOrganismId_name_environment: {
                courseOrganismId: session.courseOrganismId,
                name: session.name,
                environment: session.environment,
              },
            },
            select: sessionsSelect,
            create: {
              id: courseSessionId,
              courseOrganismId: session.courseOrganismId,
              name: session.name,
              type: session.type,
              environment: session.environment,
              startDate: session.startDate,
              endDate: session.endDate,
              code,
              professorOrganizationVersionId,
              traineeOrganizations: {
                create: prepared.data,
              },
            },
            update: {
              type: session.type,
              startDate: session.startDate,
              endDate: session.endDate,
              ...(professorOrganizationVersionId && { professorOrganizationVersionId }),
              traineeOrganizations: {
                createMany: {
                  data: prepared.data,
                  skipDuplicates: true,
                },
              },
            },
          }),
        )
      }
      return deletions.length > 0 || hasTransferredTrainees
        ? transaction.courseSession.findMany({
            where: {
              OR: [...affectedSessionsSQLRequest, { id: { in: existingSessions.map(({ id }) => id) } }],
            },
            select: sessionsSelect,
          })
        : importedSessionsPromises
    },
    { isolationLevel: 'Serializable' },
  )

  const existingSessionIds = new Set(existingSessions.map(({ id }) => id))
  const previousSessionsById = new Map(existingSessions.map((session) => [session.id, session]))
  const updatedSessions = importedSessions.flatMap((session) => {
    const previous = previousSessionsById.get(session.id)
    const update = previous ? getSessionUpdate(previous, session) : null
    return update ? [update] : []
  })

  const newSessions = importedSessions
    .filter(({ id }) => !existingSessionIds.has(id))
    .map((session) => ({
      ...session,
      trainees: getTrainees(session),
      professor: getProfessor(session),
    }))

  if (newSessions.length > 0 || updatedSessions.length > 0) {
    const organisms = await prismaClient.courseOrganism.findMany({
      where: {
        id: { in: [...new Set([...newSessions, ...updatedSessions].map(({ courseOrganismId }) => courseOrganismId))] },
      },
    })

    const emailResults = await Promise.allSettled(
      organisms.map(async (organism) => {
        try {
          await sendCourseSessionsCreatedEmail(
            organism.contactEmail,
            organism.name,
            newSessions.filter(({ courseOrganismId }) => courseOrganismId === organism.id),
            updatedSessions.filter(({ courseOrganismId }) => courseOrganismId === organism.id),
          )
        } catch (error) {
          console.error('Error sending training sessions email:', { courseOrganismId: organism.id }, error)
        }
      }),
    )
    const failedEmail = emailResults.find(({ status }) => status === 'rejected')
    if (failedEmail?.status === 'rejected') {
      console.error(failedEmail.reason)
    }
  }

  const addedTrainees =
    newSessions.reduce((count, { trainees }) => count + trainees.length, 0) +
    updatedSessions.reduce((count, { addedTrainees }) => count + addedTrainees.length, 0)
  const addedProfessors =
    newSessions.filter(({ professor }) => professor !== null).length +
    updatedSessions.filter(({ professor }) => professor?.after !== null && professor?.after !== undefined).length

  const modifiedSessions = updatedSessions.filter(({ dates }) => dates.length > 0).length

  return {
    importedSessions: newSessions.length,
    modifiedSessions,
    createdUsers: newUsers.count,
    createdAccounts: newAccounts.count,
    addedTrainees,
    addedProfessors,
    ...deletedCounts,
  }
}
