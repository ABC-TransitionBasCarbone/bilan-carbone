import { StudyTagFamilyWithTags } from '@/db/study'
import { Checkbox, FormControl, FormControlLabel, FormLabel, InputLabel, Menu, Select } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import styles from './TagFilter.module.css'

export const OTHER_TAG_ID = 'other'
const OTHER_FAMILY_ID = 'otherFamily'

type ChildrenType = { id: string; label: string }

interface TagFilterProps {
  tagFamilies: StudyTagFamilyWithTags[]
  selectedTagIds: string[]
  onChange: (ids: string[]) => void
  className?: string
  showSeparateLabel?: boolean
  hideOtherOption?: boolean
}

export const TagFilter = ({
  tagFamilies,
  selectedTagIds,
  onChange,
  className,
  showSeparateLabel = false,
  hideOtherOption = false,
}: TagFilterProps) => {
  const t = useTranslations('study.results.pageFilters')
  const tOther = useTranslations('study.results')
  const tCommon = useTranslations('common')
  const [tagFilterAnchorEl, setTagFilterAnchorEl] = useState<HTMLElement | null>(null)

  const tagItems = useMemo(
    () =>
      tagFamilies.reduce(
        (acc, tagFamily) => {
          const tagInfos = tagFamily.tags.map((tag) => ({ id: tag.id, label: tag.name }))

          if (tagInfos.length > 0) {
            acc[tagFamily.id] = {
              id: tagFamily.id,
              name: tagFamily.name,
              children: tagInfos,
            }
          }

          return acc
        },
        {} as Record<string, { id: string; name: string; children: ChildrenType[] }>,
      ),
    [tagFamilies],
  )

  const tagItemsWithOthers = useMemo<Record<string, { id: string; name: string; children: ChildrenType[] }>>(() => {
    if (hideOtherOption) {
      return tagItems
    }
    return {
      ...tagItems,
      [OTHER_FAMILY_ID]: {
        id: OTHER_FAMILY_ID,
        name: tOther('other'),
        children: [{ id: OTHER_TAG_ID, label: tOther('other') }],
      },
    }
  }, [tagItems, tOther, hideOtherOption])

  const allTagIds = useMemo(
    () => Object.values(tagItemsWithOthers).flatMap((family) => family.children.map((child) => child.id)),
    [tagItemsWithOthers],
  )

  const allSelectedTags = useMemo(
    () => allTagIds.length > 0 && allTagIds.every((tagId) => selectedTagIds.includes(tagId)),
    [allTagIds, selectedTagIds],
  )

  const tagsSelectorRenderValue = useMemo(() => {
    if (allSelectedTags) {
      return tCommon('all')
    }
    if (selectedTagIds.length === 0) {
      return tCommon('none')
    }
    // Get the labels for selected tag IDs
    const selectedTagLabels = selectedTagIds
      .map((tagId) => {
        for (const family of Object.values(tagItemsWithOthers)) {
          const tag = family.children.find((child) => child.id === tagId)
          if (tag) {
            return tag.label
          }
        }
        return null
      })
      .filter((label): label is string => label !== null)
    return selectedTagLabels.join(', ')
  }, [allSelectedTags, selectedTagIds, tagItemsWithOthers, tCommon])

  const selectAllTags = () => {
    onChange(allSelectedTags ? [] : allTagIds)
  }

  return (
    <>
      <FormControl className={classNames(styles.formControl, className)}>
        {showSeparateLabel ? (
          <FormLabel id="tag-filter-label" component="legend">
            {t('tags')}
          </FormLabel>
        ) : (
          <InputLabel id="tag-filter-label">{t('tags')}</InputLabel>
        )}
        <Select
          labelId="tag-filter-label"
          label={!showSeparateLabel ? t('tags') : undefined}
          value="tags-filter-placeholder"
          open={false}
          onMouseDown={(event) => {
            event.preventDefault()
            setTagFilterAnchorEl(event.currentTarget)
          }}
          renderValue={() => {
            return (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {tagsSelectorRenderValue}
              </span>
            )
          }}
        />
      </FormControl>

      <Menu
        anchorEl={tagFilterAnchorEl}
        open={Boolean(tagFilterAnchorEl)}
        onClose={() => setTagFilterAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <div className={classNames(styles.filters, 'px1')}>
          <FormControlLabel
            label={tCommon(allSelectedTags ? 'action.unselectAll' : 'action.selectAll')}
            control={<Checkbox checked={allSelectedTags} onChange={selectAllTags} />}
          />
          {Object.entries(tagItemsWithOthers).map(([parentId, familyInfo]) => {
            return (
              <div className="flex flex-col" key={parentId}>
                <FormControlLabel
                  label={familyInfo.name}
                  control={
                    <Checkbox
                      checked={familyInfo.children.every((child) => selectedTagIds.includes(child.id))}
                      onChange={() => {
                        if (familyInfo.children.every((child) => selectedTagIds.includes(child.id))) {
                          onChange(selectedTagIds.filter((ci) => !familyInfo.children.some((child) => child.id === ci)))
                        } else {
                          const newCheckedItems = [...selectedTagIds]
                          for (const child of familyInfo.children) {
                            if (!newCheckedItems.includes(child.id)) {
                              newCheckedItems.push(child.id)
                            }
                          }
                          onChange(newCheckedItems)
                        }
                      }}
                    />
                  }
                />
                {familyInfo.children.map((child) => (
                  <FormControlLabel
                    className="ml2"
                    key={child.label}
                    label={child.label}
                    control={
                      <Checkbox
                        checked={selectedTagIds.includes(child.id)}
                        onChange={() => {
                          if (selectedTagIds.includes(child.id)) {
                            onChange(selectedTagIds.filter((ci) => ci !== child.id))
                          } else {
                            onChange([...selectedTagIds, child.id])
                          }
                        }}
                      />
                    }
                  />
                ))}
              </div>
            )
          })}
        </div>
      </Menu>
    </>
  )
}
