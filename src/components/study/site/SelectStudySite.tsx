'use client'

import { FullStudy } from '@/db/study'
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction } from 'react'

interface Props {
  study: FullStudy
  allowAll?: boolean
  site: string
  setSite: Dispatch<SetStateAction<string>>
}

const SelectStudySite = ({ study, allowAll, site, setSite }: Props) => {
  const t = useTranslations('study.organization')

  return (
    <FormControl>
      <InputLabel id="study-site-select">{t('site')}</InputLabel>
      <Select
        labelId="study-site-select"
        label={t('site')}
        value={site === 'all' && !allowAll ? '' : site}
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
