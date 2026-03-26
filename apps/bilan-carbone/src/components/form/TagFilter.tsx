import { StudyTagFamilyWithTags } from '@/db/study'
import { Checkbox, FormControl, FormControlLabel, FormLabel, InputLabel, Menu, MenuItem, Select } from '@mui/material'
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
  isOtherDisabled?: boolean
}

export const TagFilter = ({
  tagFamilies,
  selectedTagIds,
  onChange,
  className,
  showSeparateLabel = false,
  isOtherDisabled = false,
}: TagFilterProps) => {
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

  const studyHasTags = useMemo(() => tagFamilies.some((f) => f.name !== 'DEFAULT_FAMILY_TAG'), [tagFamilies])

  const tagItemsWithOthers = useMemo<Record<string, { id: string; name: string; children: ChildrenType[] }>>(() => {
    if (!studyHasTags) {
      return {}
    }
    return {
      ...tagItems,
      [OTHER_FAMILY_ID]: {
        id: OTHER_FAMILY_ID,
        name: tOther('other'),
        children: [{ id: OTHER_TAG_ID, label: tOther('other') }],
      },
    }
  }, [studyHasTags, tagItems, tOther])

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

  const handleRealTagChange = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      // Deselecting a real tag also removes "other" when isOtherDisabled
      const next = selectedTagIds.filter((id) => id !== tagId)
      onChange(isOtherDisabled ? next.filter((id) => id !== OTHER_TAG_ID) : next)
    } else {
      onChange([...selectedTagIds, tagId])
    }
  }

  const handleFamilyChange = (familyInfo: { children: ChildrenType[] }, isOtherFamily: boolean) => {
    const allFamilySelected = familyInfo.children.every((child) => selectedTagIds.includes(child.id))
    if (allFamilySelected) {
      // Deselecting the family: remove its children + other if isOtherDisabled and this is a real family
      const next = selectedTagIds.filter((ci) => !familyInfo.children.some((child) => child.id === ci))
      onChange(isOtherDisabled && !isOtherFamily ? next.filter((id) => id !== OTHER_TAG_ID) : next)
    } else {
      const newCheckedItems = [...selectedTagIds]
      for (const child of familyInfo.children) {
        if (!newCheckedItems.includes(child.id)) {
          newCheckedItems.push(child.id)
        }
      }
      onChange(newCheckedItems)
    }
  }

  return (
    <>
      <FormControl className={classNames(styles.formControl, className)}>
        {showSeparateLabel ? (
          <FormLabel id="tag-filter-label" component="legend">
            {tCommon('tags')}
          </FormLabel>
        ) : (
          <InputLabel id="tag-filter-label" shrink>
            {tCommon('tags')}
          </InputLabel>
        )}
        {!studyHasTags ? (
          <Select
            labelId="tag-filter-label"
            label={!showSeparateLabel ? tCommon('tags') : undefined}
            value={''}
            displayEmpty
            disabled
          >
            <MenuItem value={''} disabled>
              {tCommon('noTagsAvailable')}
            </MenuItem>
          </Select>
        ) : (
          <Select
            labelId="tag-filter-label"
            label={!showSeparateLabel ? tCommon('tags') : undefined}
            value={''}
            displayEmpty
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
        )}
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
            const isOtherFamily = parentId === OTHER_FAMILY_ID
            return (
              <div className="flex flex-col" key={parentId}>
                <FormControlLabel
                  label={familyInfo.name}
                  disabled={isOtherDisabled && isOtherFamily}
                  control={
                    <Checkbox
                      checked={
                        isOtherDisabled && isOtherFamily
                          ? allSelectedTags
                          : familyInfo.children.every((child) => selectedTagIds.includes(child.id))
                      }
                      onChange={
                        isOtherDisabled && isOtherFamily
                          ? undefined
                          : () => handleFamilyChange(familyInfo, isOtherFamily)
                      }
                    />
                  }
                />
                {familyInfo.children.map((child) => {
                  const isOtherChild = child.id === OTHER_TAG_ID
                  const isDisabled = isOtherDisabled && isOtherChild
                  const isChecked = isDisabled ? allSelectedTags : selectedTagIds.includes(child.id)
                  return (
                    <FormControlLabel
                      className="ml2"
                      key={child.label}
                      label={child.label}
                      disabled={isDisabled}
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={isDisabled ? undefined : () => handleRealTagChange(child.id)}
                        />
                      }
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </Menu>
    </>
  )
}
