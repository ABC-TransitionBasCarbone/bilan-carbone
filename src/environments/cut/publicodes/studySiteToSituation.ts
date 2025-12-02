import { FullStudy } from '@/db/study'
import { CutSituation } from './types'

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
