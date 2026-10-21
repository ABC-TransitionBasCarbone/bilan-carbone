import { studySiteToClicksonSituation } from '@/environments/clickson/publicodes/studySiteToSituation'
import { studySiteToCutSituation } from '@/environments/cut/publicodes/studySiteToSituation'
import { studySiteToTiltSituation } from '@/environments/tilt/publicodes/studySiteToSituation'
import { Country, Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getEnvironmentHandlingGenericEnvs } from '@abc-transitionbascarbone/common/utils/environments'
import { Situation } from 'publicodes'
import { EnvironmentWithSimplifiedStudies } from './permissions/environment'

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
  country?: Country | null | undefined
  // constructionYear?: number | null
  // renovationYear?: number | null
}

export interface TiltStudySiteFields {
  volunteerNumber?: number | null
  beneficiaryNumber?: number | null
  etp?: number
}

export interface StudySiteFields extends CutStudySiteFields, ClicksonStudySiteFields, TiltStudySiteFields {}

export type StudySiteToSituationFn = (studySite: StudySiteFields | undefined) => Situation<string>

/**
 * Registry of studySiteToSituation functions by environment.
 * Each environment can define its own mapping from StudySite fields to Publicodes situation keys.
 */
const studySiteToSituationByEnvironment: Record<
  Exclude<EnvironmentWithSimplifiedStudies, typeof Environment.COURSE_TILT>,
  StudySiteToSituationFn
> = {
  [Environment.CUT]: studySiteToCutSituation,
  [Environment.CLICKSON]: studySiteToClicksonSituation,
  [Environment.TILT]: studySiteToTiltSituation,
}

export function getStudySiteToSituation(
  environment: EnvironmentWithSimplifiedStudies,
): StudySiteToSituationFn | undefined {
  const genericEnv = getEnvironmentHandlingGenericEnvs(environment)

  if (!genericEnv) {
    throw new Error('Unable to determine generic environment for study site to situation mapping.')
  }

  return studySiteToSituationByEnvironment[
    genericEnv as Exclude<EnvironmentWithSimplifiedStudies, typeof Environment.COURSE_TILT>
  ]
}

export function studySiteToSituation(
  environment: EnvironmentWithSimplifiedStudies,
  studySite: ClicksonStudySiteFields | undefined,
): Situation<string> {
  const fn = getStudySiteToSituation(environment)
  return fn ? fn(studySite) : {}
}
