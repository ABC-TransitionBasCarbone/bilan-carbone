import { StudySiteFields } from '@/services/studySiteToSituation'
import { TiltSituation } from './types'

/**
 * NOTE: if one of the study site fields are null or 0, some questions (which
 * depends of this inputs) will be non-applicable by default and won't be shown
 * to the user.
 */
export function studySiteToTiltSituation(studySite: StudySiteFields | undefined): TiltSituation {
  if (!studySite) {
    return {}
  }

  const situation: TiltSituation = {}

  if (studySite.distanceToParis != null) {
    situation['général . code postal'] = studySite.distanceToParis
  }


  return situation
}
