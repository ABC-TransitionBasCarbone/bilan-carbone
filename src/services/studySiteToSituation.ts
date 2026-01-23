import { studySiteToClicksonSituation } from '@/environments/clickson/publicodes/studySiteToSituation'
import { studySiteToCutSituation } from '@/environments/cut/publicodes/studySiteToSituation'
import { Environment } from '@prisma/client'
import { Situation } from 'publicodes'
import { SimplifiedEnvironment } from './publicodes/simplifiedPublicodesConfig'

export interface CutStudySiteFields {
  distanceToParis?: number | null
  numberOfTickets?: number | null
  numberOfSessions?: number | null
  numberOfOpenDays?: number | null
}

export interface ClicksonStudySiteFields {
  etp?: number | undefined
  studentNumber?: number | undefined
  superficy?: number | null | undefined
  // constructionYear?: number | null
  // renovationYear?: number | null
}

export interface StudySiteFields extends CutStudySiteFields, ClicksonStudySiteFields {}

export type StudySiteToSituationFn = (studySite: StudySiteFields | undefined) => Situation<string>

/**
 * Registry of studySiteToSituation functions by environment.
 * Each environment can define its own mapping from StudySite fields to Publicodes situation keys.
 */
const studySiteToSituationByEnvironment: Record<SimplifiedEnvironment, StudySiteToSituationFn> = {
  [Environment.CUT]: studySiteToCutSituation,
  [Environment.CLICKSON]: studySiteToClicksonSituation,
}

export function getStudySiteToSituation(environment: SimplifiedEnvironment): StudySiteToSituationFn | undefined {
  return studySiteToSituationByEnvironment[environment]
}

export function studySiteToSituation(
  environment: SimplifiedEnvironment,
  studySite: ClicksonStudySiteFields | undefined,
): Situation<string> {
  const fn = getStudySiteToSituation(environment)
  return fn ? fn(studySite) : {}
}
