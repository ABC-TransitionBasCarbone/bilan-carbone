'use client'

import type { FullStudy } from '@/db/study'
import { hasAccessToStudySiteAddAndSelection } from '@/services/permissions/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { FormControl, InputLabel, MenuItem, Select, Tooltip } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './SelectStudySite.module.css'
import { getSelectStudySiteValue } from './selectStudySite.utils'

interface Props {
  sites: FullStudy['sites']
  defaultValue?: string
  setSite?: (site: string) => void
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
  'use memo'

  const t = useTranslations('study.organization')
  const { environment } = useAppEnvironmentStore()

  const tooltipMessage: string | null = null
  if (siteSelectionDisabled) {
    if (isTransitionPlan) {
      return t('allSitesOnlyTransitionPlan')
    } else {
      return t('allSitesOnly')
    }
  }

  const value = getSelectStudySiteValue(sites, defaultValue, showAllOption)
  const orderedSites = [...(sites ?? [])].sort((a, b) => a.site.name.localeCompare(b.site.name))

  if (environment && !hasAccessToStudySiteAddAndSelection(environment)) {
    return null
  }

  return (
    <FormControl className={styles.select}>
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
            <MenuItem key={site.site.id} value={site.site.id}>
              {site.site.name}
            </MenuItem>
          ))}
        </Select>
      </Tooltip>
    </FormControl>
  )
}

export default SelectStudySite
