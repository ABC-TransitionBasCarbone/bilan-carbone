'use client'

import {
  Checkbox,
  FormControl,
  InputLabel,
  ListItemText,
  ListSubheader,
  MenuItem,
  Select,
  TextField,
} from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import styles from './TagMultiSelect.module.css'

interface TagOption {
  id: string
  name: string
  color: string | null
  family: {
    id: string
    name: string
  }
}

interface TagMultiSelectProps {
  tags: TagOption[]
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  label?: string
}

export const TagMultiSelect = ({ tags, value, onChange, disabled, label }: TagMultiSelectProps) => {
  const tCommon = useTranslations('common')
  const [searchQuery, setSearchQuery] = useState('')

  const familyNames = useMemo(() => {
    const names: Record<string, string> = {}
    tags.forEach((tag) => {
      names[tag.family.id] = tag.family.name
    })
    return names
  }, [tags])

  const filteredTags = useMemo(() => {
    if (!searchQuery) {
      return tags
    }
    const query = searchQuery.toLowerCase()
    return tags.filter((tag) => tag.name.toLowerCase().includes(query) || tag.family.name.toLowerCase().includes(query))
  }, [tags, searchQuery])

  const renderValue = () => {
    if (value.length === 0) {
      return tCommon('none')
    }
    return `${value.length} ${value.length === 1 ? tCommon('selected') : tCommon('selectedPlural')}`
  }

  const handleSelectTag = (tagId: string) => {
    const newValue = value.includes(tagId) ? value.filter((id) => id !== tagId) : [...value, tagId]
    onChange(newValue)
  }

  const filteredTagsByFamily = useMemo(() => {
    const grouped: Record<string, TagOption[]> = {}
    filteredTags.forEach((tag) => {
      if (!grouped[tag.family.id]) {
        grouped[tag.family.id] = []
      }
      grouped[tag.family.id].push(tag)
    })
    return grouped
  }, [filteredTags])

  return (
    <FormControl className={styles.formControl}>
      <InputLabel shrink id="tag-select-label">
        {label || tCommon('tags')}
      </InputLabel>
      <Select
        labelId="tag-select-label"
        value={[]}
        multiple
        displayEmpty
        disabled={disabled}
        label={label || tCommon('tags')}
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

        {Object.entries(filteredTagsByFamily).map(([familyId, familyTags]) => (
          <div key={`family-${familyId}`}>
            <ListSubheader className={styles.groupHeader}>{familyNames[familyId]}</ListSubheader>
            {familyTags.map((tag) => (
              <MenuItem key={`tag-${tag.id}`} onClick={() => handleSelectTag(tag.id)} className={styles.indentedItem}>
                <Checkbox checked={value.includes(tag.id)} />
                <ListItemText primary={tag.name} />
              </MenuItem>
            ))}
          </div>
        ))}

        {filteredTags.length === 0 && (
          <MenuItem disabled>
            <ListItemText primary={tCommon('noResults')} />
          </MenuItem>
        )}
      </Select>
    </FormControl>
  )
}
