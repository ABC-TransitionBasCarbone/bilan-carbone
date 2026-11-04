import { CourseSessionType, Environment } from '@abc-transitionbascarbone/common/db'

export type CourseParticipant = {
  email: string
  firstName: string
  lastName: string
  OfUpdatedAt?: Date
}

export type CourseSession = {
  courseOrganismId: string
  name: string
  type: CourseSessionType
  startDate: Date
  endDate: Date
  environment: Environment
  trainees: CourseParticipant[]
  professor: CourseParticipant | null
}

export type CourseSessionDeletion = {
  courseOrganismId: string
  name: string
} & ({ type: 'session' } | { type: 'stagiaire' | 'formateur'; email: string })

export type CourseSessionImport = {
  sessions: CourseSession[]
  deletions: CourseSessionDeletion[]
}
