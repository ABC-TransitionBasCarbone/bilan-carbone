import { prismaClient } from '@/db/client.server'
import { createUsersWithAccount } from '@/db/user'
import type { Prisma } from '@abc-transitionbascarbone/common/db'
import {
  CourseSessionTraineeOrganizationStatus,
  Environment,
  Role,
  UserSource,
  UserStatus,
} from '@abc-transitionbascarbone/common/db/enums'
import {
  sendCourseSessionsCreatedEmail,
  type TrainingSessionUpdate,
} from '@abc-transitionbascarbone/common/services/email/email'
import { Client } from 'basic-ftp'
import { randomInt } from 'crypto'
import fs from 'fs'
import path from 'path'
import { downloadFileFromFTP, getFTPClient } from '../utils'
import { parseCourseSessionWorkbook } from './importTrainingSessionsParsing'
import { CourseSessionImport } from './importTrainingSessionsType'
import { getProfessor, getTrainees, SavedCourseSession, sessionsSelect } from './importTrainingSessionsUtils'

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
  const imports = organisms.map(({ id }) => parseCourseSessionWorkbook(data, id))
  return {
    sessions: imports.flatMap(({ sessions }) => sessions),
    deletions: imports.flatMap(({ deletions }) => deletions),
  }
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

  const userAccountInSession = []
  for (const session of notFinishedSessions) {
    for (const participant of session.trainees) {
      userAccountInSession.push({ ...participant, environment: session.environment })
    }
    if (session.professor) {
      userAccountInSession.push({ ...session.professor, environment: session.environment })
    }
  }

  const { newUsers, newAccounts } =
    userAccountInSession.length > 0
      ? await createUsersWithAccount(
          userAccountInSession.map(({ email, firstName, lastName, environment }) => ({
            email,
            firstName,
            lastName,
            source: UserSource.CRON,
            account: {
              environment,
              role: Role.DEFAULT,
              status: UserStatus.IMPORTED,
              user: { create: undefined, connectOrCreate: undefined, connect: undefined },
            },
          })),
        )
      : { newUsers: { count: 0 }, newAccounts: { count: 0 } }

  const accounts =
    userAccountInSession.length > 0
      ? await prismaClient.account.findMany({
          where: {
            environment: { in: [...new Set(notFinishedSessions.map(({ environment }) => environment))] },
            user: { email: { in: userAccountInSession.map(({ email }) => email) } },
          },
          select: {
            id: true,
            environment: true,
            organizationVersionId: true,
            user: { select: { email: true, firstName: true, lastName: true } },
          },
        })
      : []
  const createdOrganizationVersions = await prismaClient.$transaction(
    accounts
      .filter(({ organizationVersionId }) => !organizationVersionId)
      .map((account) =>
        prismaClient.account.update({
          where: { id: account.id },
          data: {
            organizationVersion: {
              create: {
                environment: account.environment,
                organization: { create: { name: `${account.user.firstName} ${account.user.lastName}` } },
              },
            },
          },
          select: { id: true, organizationVersionId: true },
        }),
      ),
  )
  const createdOrganizationVersionIds = new Map(
    createdOrganizationVersions.map(({ id, organizationVersionId }) => [id, organizationVersionId]),
  )
  const accountsWithOrganizationVersions = accounts.map((account) => ({
    ...account,
    organizationVersionId: account.organizationVersionId ?? createdOrganizationVersionIds.get(account.id) ?? null,
  }))

  const affectedSessionsSQLRequest: Prisma.CourseSessionWhereInput[] = [
    ...notFinishedSessions.flatMap(({ courseOrganismId, name, environment, type, trainees }) => [
      { courseOrganismId, type, name, environment },
      ...(trainees.length > 0
        ? [
            {
              courseOrganismId,
              type,
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
  const conflictingRegistrations = notFinishedSessions.flatMap((session) =>
    existingSessions.flatMap((previous) => {
      if (
        previous.courseOrganismId !== session.courseOrganismId ||
        (previous.name === session.name && previous.environment === session.environment)
      ) {
        return []
      }
      const imported = sessions.find(
        ({ courseOrganismId, name, environment }) =>
          courseOrganismId === previous.courseOrganismId &&
          name === previous.name &&
          environment === previous.environment,
      )
      if ((imported ? imported.type : previous.type) !== session.type) {
        return []
      }
      const previousEmails = new Set(getTrainees(previous).map(({ email }) => email))
      const emails = session.trainees.filter(({ email }) => previousEmails.has(email)).map(({ email }) => email)
      return emails.length > 0 ? [{ courseSessionId: previous.id, emails }] : []
    }),
  )

  const importedSessions = await prismaClient.$transaction(async (transaction) => {
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
    for (const { courseSessionId, emails } of conflictingRegistrations) {
      deletedCounts.deletedTrainees += (
        await transaction.courseSessionTraineeOrganization.deleteMany({
          where: {
            courseSessionId,
            organizationVersion: { userAccounts: { some: { user: { email: { in: emails } } } } },
          },
        })
      ).count
    }
    const importedSessionsPromises = []
    for (const session of notFinishedSessions) {
      const courseStatus =
        session.startDate <= today
          ? CourseSessionTraineeOrganizationStatus.ACTIVE
          : CourseSessionTraineeOrganizationStatus.INACTIVE
      const professorOrganizationVersionId = session.professor
        ? getOrganizationVersionId(accountsWithOrganizationVersions, session.professor.email, session.environment)
        : null
      const traineeOrganizationVersionIds = session.trainees.map(({ email }) =>
        getOrganizationVersionId(accountsWithOrganizationVersions, email, session.environment),
      )

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
            courseOrganismId: session.courseOrganismId,
            name: session.name,
            type: session.type,
            environment: session.environment,
            startDate: session.startDate,
            endDate: session.endDate,
            code,
            professorOrganizationVersionId,
            traineeOrganizations: {
              create: traineeOrganizationVersionIds.map((id) => ({
                organizationVersion: { connect: { id } },
                courseStatus,
              })),
            },
          },
          update: {
            type: session.type,
            startDate: session.startDate,
            endDate: session.endDate,
            ...(professorOrganizationVersionId && { professorOrganizationVersionId }),
            traineeOrganizations: {
              createMany: {
                data: traineeOrganizationVersionIds.map((organizationVersionId) => ({
                  organizationVersionId,
                  courseStatus,
                })),
                skipDuplicates: true,
              },
            },
          },
        }),
      )
    }
    return deletions.length > 0 || conflictingRegistrations.length > 0
      ? transaction.courseSession.findMany({
          where: {
            OR: [...affectedSessionsSQLRequest, { id: { in: existingSessions.map(({ id }) => id) } }],
          },
          select: sessionsSelect,
        })
      : importedSessionsPromises
  })

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
