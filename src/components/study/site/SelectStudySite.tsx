'use client'

import { FullStudy } from '@/db/study'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction } from 'react'

interface Props {
  study: FullStudy | StudyWithoutDetail
  allowAll?: boolean
  studySite: string
  setSite: Dispatch<SetStateAction<string>>
  withLabel?: boolean
}

const SelectStudySite = ({ study, allowAll, studySite, setSite, withLabel = true }: Props) => {
  const t = useTranslations('study.organization')

  return (
    <FormControl>
      {withLabel && <InputLabel id="study-site-select">{t('site')}</InputLabel>}
      <Select
        labelId="study-site-select"
        label={withLabel ? t('site') : undefined}
        value={studySite === 'all' && !allowAll ? '' : studySite}
        onChange={(event) => setSite(event.target.value)}
        disabled={study.sites.length === 1 && !allowAll}
      >
        {allowAll && <MenuItem value={'all'}>{t('allSites')}</MenuItem>}
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
