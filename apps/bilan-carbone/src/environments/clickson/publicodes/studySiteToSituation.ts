import { StudySiteFields } from '@/services/studySiteToSituation'
import { Country } from '@repo/db-common/enums'
import { ClicksonSituation } from './types'

const publicodesCountriesMapping: Partial<Record<Country, string>> = {
  [Country.FRANCE]: "'FRANCE'",
  [Country.ROMANIA]: "'ROUMANIE'",
  [Country.CROATIA]: "'CROATIE'",
  [Country.HUNGARY]: "'HONGRIE'",
}

/**
 * NOTE: if one of the study site fields are null or 0, some questions (which
 * depends of this inputs) will be non-applicable by default and won't be shown
 * to the user.
 */
export function studySiteToClicksonSituation(studySite: StudySiteFields | undefined): ClicksonSituation {
  if (!studySite) {
    return {}
  }

  const situation: ClicksonSituation = {}

  if (studySite.studentNumber != null) {
    situation['général . nombre étudiant'] = studySite.studentNumber
  }
  if (studySite.etp != null) {
    situation['général . nombre personnel'] = studySite.etp
  }
  if (studySite.country != null) {
    const country = publicodesCountriesMapping?.[studySite.country] || "'FRANCE'"
    if (country) {
      situation['général . pays'] = country
    }
  }
  // TODO: not available yet for Clickson
  // if (studySite.constructionYear != null) {
  //   situation['général . année de construction'] = studySite.constructionYear
  // }
  // if (studySite.renovationYear != null) {
  //   situation['général . année de rénovation'] = studySite.renovationYear
  // }

  return situation
}
