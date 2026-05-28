import type { FullStudy } from '@/db/study'

export const getSelectStudySiteValue = (
  sites: FullStudy['sites'] | null | undefined,
  siteId: string,
  showAllOption = true,
): string => {
  if (sites?.length === 1) {
    return sites[0].site.id
  }

  if (siteId === 'all' || !siteId) {
    return showAllOption ? 'all' : (sites?.[0]?.site.id ?? siteId)
  }

  return siteId
}
