import { StudySiteFields } from '@/services/studySiteToSituation'
import { CutSituation } from './types'

/**
 * NOTE: if one of the study site fields are null or 0, some questions (which
 * depends of this inputs) will be non-applicable by default and won't be shown
 * to the user.
 */
export function studySiteToSituation(studySite: StudySiteFields | undefined): CutSituation {
  if (!studySite) {
    return {}
  }

  const situation: CutSituation = {}

  if (studySite.distanceToParis != null) {
    situation['général . distance depuis paris'] = studySite.distanceToParis
  }
  if (studySite.numberOfTickets != null) {
    situation['général . nombre entrées'] = studySite.numberOfTickets
  }
  if (studySite.numberOfSessions != null) {
    situation['général . nombre séances'] = studySite.numberOfSessions
  }
  if (studySite.numberOfOpenDays != null) {
    situation['général . nombre de jours ouverture'] = studySite.numberOfOpenDays
  }

  return situation
}
