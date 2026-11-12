'use client'

import { HomeCardItem } from '@/types/homeCards'
import { getVisibleHomeCards } from '@/utils/homeCards'
import { TextField } from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import { Dayjs } from 'dayjs'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

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

  const invalidStartDate = !!startDate && !startDate.isValid()
  const invalidEndDate = !!endDate && !endDate.isValid()
  const invalidDateRange = startDate?.isAfter(endDate, 'day')
  const invalidDateFilter = invalidStartDate || invalidEndDate || invalidDateRange

  useEffect(() => {
    setVisibleItems(getVisibleHomeCards(items, type, search, startDate, endDate))
  }, [items, type, search, startDate, endDate, setVisibleItems])

  return (
    <div className="flex wrap gapped1 mb1">
      <TextField label={t('homeCards.search')} value={search} onChange={(event) => setSearch(event.target.value)} />
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
                error: !!(startDate && !startDate.isValid()) || invalidDateFilter,
                helperText:
                  startDate && !startDate.isValid()
                    ? t('homeCards.invalidDate')
                    : invalidDateFilter
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
                error: !!(endDate && !endDate.isValid()) || invalidDateFilter,
                helperText:
                  endDate && !endDate.isValid()
                    ? t('homeCards.invalidDate')
                    : invalidDateFilter
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
