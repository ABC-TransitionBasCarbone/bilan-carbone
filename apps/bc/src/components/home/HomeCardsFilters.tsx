'use client'

import { sortAlphabetically } from '@/services/utils'
import { normalizeStringForSearch } from '@/utils/string'
import { TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs, { Dayjs } from 'dayjs'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { HomeCardItem } from './HomeCard'

interface Props {
  type: 'clients' | 'sessions'
  items: HomeCardItem[]
  setVisibleItems: (items: HomeCardItem[]) => void
}

const HomeCardsFilters = ({ type, items, setVisibleItems }: Props) => {
  const t = useTranslations()
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState<Dayjs | null>(null)
  const [endDate, setEndDate] = useState<Dayjs | null>(null)
  const invalidDateRange = !!(startDate?.isValid() && endDate?.isValid() && startDate.isAfter(endDate, 'day'))
  useEffect(() => {
    const normalizedSearch = normalizeStringForSearch(search)

    const visibleItems = items
      .filter((item) => {
        if (!normalizeStringForSearch(item.name).includes(normalizedSearch)) {
          return false
        }
        if (type === 'clients') {
          return true
        }
        if (invalidDateRange || (startDate && !startDate.isValid()) || (endDate && !endDate.isValid())) {
          return false
        }
        return (
          (!startDate || (!!item.endDate && !dayjs(item.endDate).isBefore(startDate, 'day'))) &&
          (!endDate || (!!item.startDate && !dayjs(item.startDate).isAfter(endDate, 'day')))
        )
      })
      .sort((a, b) => {
        if (type === 'clients') {
          return sortAlphabetically(a.name, b.name)
        }
        if (!a.startDate) {
          return b.startDate ? 1 : sortAlphabetically(a.name, b.name)
        }
        if (!b.startDate) {
          return -1
        }
        return b.startDate.getTime() - a.startDate.getTime() || sortAlphabetically(a.name, b.name)
      })
    setVisibleItems(visibleItems)
  }, [items, type, search, startDate, endDate, invalidDateRange, setVisibleItems])

  return (
    <div className="flex wrap gapped1 mb1">
      <TextField
        label={t(type === 'clients' ? 'homeCards.searchClients' : 'homeCards.searchSessions')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      {type === 'sessions' && (
        <>
          <DatePicker
            label={t('common.label.start')}
            value={startDate}
            maxDate={endDate?.isValid() ? endDate : undefined}
            onChange={setStartDate}
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!(startDate && !startDate.isValid()) || invalidDateRange,
                helperText:
                  startDate && !startDate.isValid()
                    ? t('homeCards.invalidDate')
                    : invalidDateRange
                      ? t('homeCards.invalidDateRange')
                      : undefined,
              },
            }}
          />
          <DatePicker
            label={t('common.label.end')}
            value={endDate}
            minDate={startDate?.isValid() ? startDate : undefined}
            onChange={setEndDate}
            slotProps={{
              field: { clearable: true },
              textField: {
                error: !!(endDate && !endDate.isValid()) || invalidDateRange,
                helperText:
                  endDate && !endDate.isValid()
                    ? t('homeCards.invalidDate')
                    : invalidDateRange
                      ? t('homeCards.invalidDateRange')
                      : undefined,
              },
            }}
          />
        </>
      )}
    </div>
  )
}

export default HomeCardsFilters
