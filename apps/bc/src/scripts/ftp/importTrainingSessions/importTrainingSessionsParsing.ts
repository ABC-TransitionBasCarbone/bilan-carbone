import { getRecords, Worksheet } from '@/utils/excel.utils'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import xlsx from 'node-xlsx'
import {
  CourseParticipant,
  CourseSession,
  CourseSessionDeletion,
  CourseSessionImport,
} from './importTrainingSessionsType'
import {
  COURSE_ENVIRONMENT_BY_WORKBOOK_VALUE,
  getDateAtMidnight,
  getParticipant,
  getRecordTimestamp,
  getRequiredText,
  getSession,
  normalizeEmail,
} from './importTrainingSessionsUtils'

const handleDeletionTab = (worksheets: Worksheet[], courseOrganismId: string) => {
  const deletions: CourseSessionDeletion[] = []

  if (worksheets.some(({ name }) => name.trim() === 'A supprimer')) {
    for (const record of getRecords(worksheets, 'A supprimer')) {
      if (Object.values(record).every((value) => value == null || String(value).trim() === '')) {
        continue
      }
      const type = getRequiredText(record, 'Type')?.toLowerCase()
      const name = getRequiredText(record, 'Session')

      if (!type || !name) {
        continue
      }
      if (type === 'session' || type === 'sessions') {
        deletions.push({ courseOrganismId, name, type: 'session' })
      } else if (type === 'stagiaire' || type === 'formateur') {
        const email = normalizeEmail(record)
        if (!email) {
          continue
        }
        deletions.push({ courseOrganismId, name, type, email })
      } else {
        console.error(`Unsupported training deletion type: ${type}`)
      }
    }
  }

  return deletions
}

const handleSessionTab = (worksheets: Worksheet[], deletedSessionNames: Set<string>, courseOrganismId: string) => {
  const sessions = new Map<string, CourseSession>()
  const sessionTimestamps = new Map<string, number>()

  for (const record of getRecords(worksheets, 'Sessions')) {
    const name = getRequiredText(record, 'Nom de la session')
    if (!name || deletedSessionNames.has(name)) {
      continue
    }

    const environmentValue = getRequiredText(record, 'Environment')?.toUpperCase()
    if (!environmentValue) {
      console.error('error in environmentValue', environmentValue)
      continue
    }

    const environment = COURSE_ENVIRONMENT_BY_WORKBOOK_VALUE[environmentValue]
    if (!environment) {
      console.error(`Unsupported training environment: ${environmentValue}`)
      continue
    }

    const timestamp = getRecordTimestamp(record)
    if (timestamp < (sessionTimestamps.get(name) ?? -Infinity)) {
      continue
    }

    const typeValue = record['Type de formation'] ?? record['type de formation']
    if (typeValue != null && typeof typeValue !== 'string') {
      console.error(`Invalid Type de formation for training session: ${name}`)
      continue
    }
    const type = typeValue?.trim().toUpperCase() || (environment === Environment.COURSE_BC ? 'M1' : null)

    const startDate = getDateAtMidnight(record, 'Date de début')
    const endDate = getDateAtMidnight(record, 'Date de fin')
    endDate.setUTCHours(23, 59, 59, 999)
    if (startDate > endDate) {
      console.error(`Invalid date range for training session: ${name}`)
      continue
    }

    sessionTimestamps.set(name, timestamp)
    sessions.set(name, {
      courseOrganismId,
      name,
      type,
      startDate,
      endDate,
      environment,
      trainees: [],
      professor: null,
    })
  }

  return sessions
}

const cloneSessions = (sessions: Map<string, CourseSession>) =>
  new Map(
    [...sessions].map(([name, session]) => [
      name,
      {
        ...session,
        startDate: new Date(session.startDate),
        endDate: new Date(session.endDate),
        trainees: session.trainees.map((trainee) => ({ ...trainee })),
        professor: session.professor ? { ...session.professor } : null,
      },
    ]),
  )

const handleTraineeTab = (
  worksheets: Worksheet[],
  deletedSessionNames: Set<string>,
  deletions: CourseSessionDeletion[],
  sessions: Map<string, CourseSession>,
) => {
  const sessionsWithTrainees = cloneSessions(sessions)
  const traineeAssignments = new Map<
    string,
    { session: CourseSession; trainee: CourseParticipant; timestamp: number }
  >()
  for (const record of getRecords(worksheets, 'Stagiaires')) {
    const sessionName = getRequiredText(record, 'Nom de la session')
    if (!sessionName || deletedSessionNames.has(sessionName)) {
      continue
    }
    const session = getSession(sessionsWithTrainees, record)
    if (!session) {
      console.error('Problème en important la session')
      continue
    }
    const trainee = getParticipant(record)
    if (
      !trainee ||
      deletions.some(
        (deletion) =>
          deletion.type === 'stagiaire' && deletion.name === session.name && deletion.email === trainee.email,
      )
    ) {
      continue
    }
    const key = JSON.stringify([session.type, trainee.email])
    const timestamp = getRecordTimestamp(record)
    const previous = traineeAssignments.get(key)
    if (!previous || timestamp >= previous.timestamp) {
      traineeAssignments.set(key, { session, trainee, timestamp })
    }
  }

  for (const { session, trainee } of traineeAssignments.values()) {
    session.trainees.push(trainee)
  }

  return sessionsWithTrainees
}

const handleProfessorTab = (
  worksheets: Worksheet[],
  deletedSessionNames: Set<string>,
  deletions: CourseSessionDeletion[],
  sessions: Map<string, CourseSession>,
) => {
  const sessionsWithProfessors = cloneSessions(sessions)
  for (const record of getRecords(worksheets, 'Formateur')) {
    const sessionName = getRequiredText(record, 'Nom de la session')

    if (!sessionName || deletedSessionNames.has(sessionName)) {
      continue
    }
    const session = getSession(sessionsWithProfessors, record)
    if (!session) {
      console.error('Problème en important la session')
      continue
    }

    const professor = getParticipant(record)
    if (
      !professor ||
      deletions.some(
        (deletion) =>
          deletion.type === 'formateur' && deletion.name === session.name && deletion.email === professor.email,
      )
    ) {
      continue
    }
    session.professor = professor
  }

  return sessionsWithProfessors
}

export const parseCourseSessionWorkbook = (data: Buffer, courseOrganismId: string): CourseSessionImport => {
  const worksheets = xlsx.parse(data) as Worksheet[]

  const deletions = handleDeletionTab(worksheets, courseOrganismId)
  const deletedSessionNames = new Set(deletions.filter(({ type }) => type === 'session').map(({ name }) => name))

  const sessions = handleSessionTab(worksheets, deletedSessionNames, courseOrganismId)

  const sessionWithTrainee = handleTraineeTab(worksheets, deletedSessionNames, deletions, sessions)

  const sessionsWithAllInfos = handleProfessorTab(worksheets, deletedSessionNames, deletions, sessionWithTrainee)

  return { sessions: [...sessionsWithAllInfos.values()], deletions }
}
