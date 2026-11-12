import { sortAlphabetically } from '@/services/utils'
import { HomeCardItem } from '@/types/homeCards'
import dayjs, { Dayjs } from 'dayjs'
import { normalizeStringForSearch } from './string'

export const sortHomeCards = (a: HomeCardItem, b: HomeCardItem, type: 'clients' | 'sessions') => {
  const clientPriority = Number(b.type === 'client') - Number(a.type === 'client')
  if (clientPriority) {
    return clientPriority
  }
  if (type === 'clients' || a.type === 'client' || (!a.startDate && !b.startDate)) {
    return sortAlphabetically(a.name, b.name)
  }
  if (!a.startDate) {
    return b.startDate ? 1 : sortAlphabetically(a.name, b.name)
  }
  if (!b.startDate) {
    return -1
  }
  return b.startDate.getTime() - a.startDate.getTime() || sortAlphabetically(a.name, b.name)
}

export const getVisibleHomeCards = (
  items: HomeCardItem[],
  type: 'clients' | 'sessions',
  search: string,
  startDate: Dayjs | null,
  endDate: Dayjs | null,
) => {
  const normalizedSearch = normalizeStringForSearch(search)
  const invalidDateFilter =
    (startDate && !startDate.isValid()) || (endDate && !endDate.isValid()) || startDate?.isAfter(endDate, 'day')

  return items
    .filter((item) => {
      if (type === 'sessions' && item.type === 'client') {
        return true
      }
      if (!normalizeStringForSearch(item.name).includes(normalizedSearch)) {
        return false
      }
      if (type === 'clients') {
        return true
      }
      if (invalidDateFilter) {
        return false
      }
      return (
        (!startDate || (!!item.endDate && !dayjs(item.endDate).isBefore(startDate, 'day'))) &&
        (!endDate || (!!item.startDate && !dayjs(item.startDate).isAfter(endDate, 'day')))
      )
    })
    .sort((a, b) => sortHomeCards(a, b, type))
}
