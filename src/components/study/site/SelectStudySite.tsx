'use client'

import { FullStudy } from '@/db/study'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import useStudySite from './useStudySite'

interface Props {
  study: FullStudy
  allowAll?: boolean
}

const SelectStudySite = ({ study, allowAll }: Props) => {
  const t = useTranslations('study.organization')
  const { site, setSite } = useStudySite(study.id)

  useEffect(() => {
    if (!site && !allowAll) {
      setSite(study.sites[0].id)
    }
  }, [allowAll])

  return (
    <FormControl>
      <InputLabel id="study-site-select">{t('site')}</InputLabel>
      <Select
        labelId="study-site-select"
        label={t('site')}
        value={site}
        onChange={(event) => setSite(event.target.value)}
        disabled={study.sites.length === 1 || allowAll}
      >
        {allowAll && <MenuItem value={''}>{t('all')}</MenuItem>}
        {study.sites.map((site) => (
          <MenuItem key={site.id} value={site.id}>
            {site.site.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

export default SelectStudySite
