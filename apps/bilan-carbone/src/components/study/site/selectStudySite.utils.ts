import type { FullStudy } from '@/db/study'
import { Translations } from '@abc-transitionbascarbone/lib'

export const getSelectStudySiteValue = (sites: FullStudy['sites'], siteId: string, showAllOption = true): string => {
  if (sites.length === 1) {
    return sites[0].site.id
  }

  if (siteId === 'all' || !siteId) {
    return showAllOption ? 'all' : (sites[0]?.site.id ?? siteId)
  }

  return siteId
}

export const getSiteLabelFromId = (study: FullStudy, siteId: string, tOrga: Translations): string => {
  if (siteId === 'all') {
    return tOrga('allSites')
  }
  const site = study.sites.find((studySite) => studySite.site.id === siteId)
  return site?.site.name ?? ''
}
