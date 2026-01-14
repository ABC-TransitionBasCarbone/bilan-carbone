import { StudySiteFields } from '@/services/studySiteToSituation'
import { ClicksonSituation } from './types'

/**
 * NOTE: if one of the study site fields are null or 0, some questions (which
 * depends of this inputs) will be non-applicable by default and won't be shown
 * to the user.
 */
export function studySiteToSituation(studySite: StudySiteFields | undefined): ClicksonSituation {
  if (!studySite) {
    return {}
  }

  const situation: ClicksonSituation = {}

  if (studySite.numberOfStudents != null) {
    situation['général . nombre étudiant'] = studySite.numberOfStudents
  }
  if (studySite.numberOfStaff != null) {
    situation['général . nombre personnel'] = studySite.numberOfStaff
  }
  if (studySite.constructionYear != null) {
    situation['général . année de construction'] = studySite.constructionYear
  }
  if (studySite.renovationYear != null) {
    situation['général . année de rénovation'] = studySite.renovationYear
  }

  return situation
}
