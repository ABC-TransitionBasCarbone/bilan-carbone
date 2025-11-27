'use client'

import type { FullStudy } from '@/db/study'
import { FormControl, InputLabel, MenuItem, Select, Tooltip } from '@mui/material'
import { useTranslations } from 'next-intl'
import { Dispatch, SetStateAction, useMemo } from 'react'

interface Props {
  sites: FullStudy['sites']
  defaultValue?: string
  setSite?: Dispatch<SetStateAction<string>>
  withLabel?: boolean
  siteSelectionDisabled?: boolean
  isTransitionPlan?: boolean
  showAllOption?: boolean
}

const SelectStudySite = ({
  sites,
  defaultValue = 'all',
  setSite,
  withLabel = true,
  siteSelectionDisabled = false,
  isTransitionPlan = false,
  showAllOption = true,
}: Props) => {
  const t = useTranslations('study.organization')

  const tooltipMessage = useMemo(() => {
    if (siteSelectionDisabled) {
      if (isTransitionPlan) {
        return t('allStiesOnlyTransitionPlan')
      } else {
        return t('allSitesOnly')
      }
    }
    return null
  }, [siteSelectionDisabled, isTransitionPlan, t])

  const value = useMemo(() => {
    if (sites?.length === 1) {
      return sites[0].id
    } else if (showAllOption && defaultValue === 'all') {
      return 'all'
    } else {
      return defaultValue
    }
  }, [sites, showAllOption, defaultValue])

  const orderedSites = useMemo(() => {
    return sites?.sort((a, b) => a.site.name.localeCompare(b.site.name)) ?? []
  }, [sites])

  return (
    <FormControl>
      {withLabel && <InputLabel id="study-site-select">{t('site')}</InputLabel>}
      <Tooltip title={tooltipMessage} placement="right" arrow>
        <Select
          fullWidth={false}
          labelId="study-site-select"
          label={withLabel ? t('site') : undefined}
          value={value}
          onChange={(event) => setSite?.(event.target.value)}
          disabled={sites.length === 1 || siteSelectionDisabled}
        >
          {showAllOption && <MenuItem value={'all'}>{t('allSites')}</MenuItem>}
          {orderedSites.map((site) => (
            <MenuItem key={site.id} value={site.id}>
              {site.site.name}
            </MenuItem>
          ))}
        </Select>
      </Tooltip>
    </FormControl>
  )
}

export default SelectStudySite
