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

  if (studySite.volunteerNumber) {
    situation['général . bénévoles'] = studySite.volunteerNumber
  }

  if (studySite.beneficiaryNumber) {
    situation['général . bénéficiaires'] = studySite.beneficiaryNumber
  }

  if (studySite.etp) {
    situation['général . salariés'] = studySite.etp
  }

  return situation
}
