import { FullStudy } from '@/db/study'
import { CutSituation } from './types'

/**
 * NOTE: if one of the study site fields are null or 0, some questions (which
 * depends of this inputs) will be non-applicable by default and won't be shown
 * to the user.
 */
export function studySiteToSituation(study: FullStudy['sites'][number] | undefined): CutSituation {
  if (!study) {
    return {}
  }

  const situation: CutSituation = {}

  if (study.distanceToParis !== null) {
    situation['général . distance depuis paris'] = study.distanceToParis
  }
  if (study.numberOfTickets !== null) {
    situation['général . nombre entrées'] = study.numberOfTickets
  }
  if (study.numberOfSessions !== null) {
    situation['général . nombre séances'] = study.numberOfSessions
  }
  if (study.numberOfOpenDays !== null) {
    situation['général . nombre de jours ouverture'] = study.numberOfOpenDays
  }

  return situation
}
