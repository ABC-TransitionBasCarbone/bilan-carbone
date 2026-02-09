'use client'

import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import styles from './SiteMultiSelect.module.css'

interface SiteOption {
  id: string
  name: string
}

interface SiteMultiSelectProps {
  sites: SiteOption[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  label?: string
}

export const SiteMultiSelect = ({ sites, value, onChange, disabled, label }: SiteMultiSelectProps) => {
  const tCommon = useTranslations('common')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSites = useMemo(() => {
    if (!searchQuery) {
      return sites
    }
    const query = searchQuery.toLowerCase()
    return sites.filter((site) => site.name.toLowerCase().includes(query))
  }, [sites, searchQuery])

  const renderValue = () => {
    if (value.length === 0) {
      return tCommon('none')
    }
    return `${value.length} ${value.length === 1 ? tCommon('selected') : tCommon('selectedPlural')}`
  }

  const handleSelectSite = (siteId: string) => {
    const newValue = value.includes(siteId) ? value.filter((id) => id !== siteId) : [...value, siteId]
    onChange(newValue)
  }

  return (
    <FormControl className={styles.formControl}>
      <InputLabel shrink id="site-select-label">
        {label || tCommon('sites')}
      </InputLabel>
      <Select
        labelId="site-select-label"
        value={[]}
        multiple
        displayEmpty
        disabled={disabled}
        label={label || tCommon('sites')}
        renderValue={renderValue}
        MenuProps={{
          PaperProps: {
            className: styles.menuPaper,
          },
        }}
      >
        <MenuItem className={styles.searchItem} disableRipple>
          <TextField
            size="small"
            placeholder={tCommon('search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            className={styles.searchInput}
            fullWidth
          />
        </MenuItem>

        {filteredSites.map((site) => (
          <MenuItem key={`site-${site.id}`} onClick={() => handleSelectSite(site.id)}>
            <Checkbox checked={value.includes(site.id)} />
            <ListItemText primary={site.name} />
          </MenuItem>
        ))}

        {filteredSites.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary={tCommon('noResults')} />
          </MenuItem>
        )}
      </Select>
    </FormControl>
  )
}
