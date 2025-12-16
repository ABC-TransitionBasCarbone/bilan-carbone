import { studySiteToSituation as cutStudySiteToSituation } from '@/environments/cut/publicodes/studySiteToSituation'
import { Environment } from '@prisma/client'
import { Situation } from 'publicodes'

export type StudySiteFields = {
  distanceToParis?: number | null
  numberOfTickets?: number | null
  numberOfSessions?: number | null
  numberOfOpenDays?: number | null
}

export type StudySiteToSituationFn = (studySite: StudySiteFields | undefined) => Situation<string>

/**
 * Registry of studySiteToSituation functions by environment.
 * Each environment can define its own mapping from StudySite fields to Publicodes situation keys.
 */
const studySiteToSituationByEnvironment: Partial<Record<Environment, StudySiteToSituationFn>> = {
  [Environment.CUT]: cutStudySiteToSituation,
}

export function getStudySiteToSituation(environment: Environment): StudySiteToSituationFn | undefined {
  return studySiteToSituationByEnvironment[environment]
}

export function studySiteToSituation(
  environment: Environment,
  studySite: StudySiteFields | undefined,
): Situation<string> {
  const fn = getStudySiteToSituation(environment)
  return fn ? fn(studySite) : {}
}
