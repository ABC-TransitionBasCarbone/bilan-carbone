import { Translations } from '@/types/translation'
import { BasicTypeCharts } from '@/utils/charts'
import { Checkbox, FormControlLabel, Menu } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import styles from './Filters.module.css'

type FilterType = BasicTypeCharts & { familyId?: string }
type ChildrenType = { id: string; label: string }

const getTagItems = <T extends FilterType>(results: T[]) => {
  return results
    .filter((result) => result.post !== 'total')
    .reduce(
      (acc, result) => {
        if (!result.familyId || !result.children) {
          return acc
        }

        acc[result.familyId] = {
          id: result.familyId,
          name: result.label,
          children: result.children.filter((tag) => tag.value > 0).map((tag) => ({ id: tag.label, label: tag.label })),
        }

        return acc
      },
      {} as Record<string, { id: string; name: string; children: ChildrenType[] }>,
    )
}

const getPostItems = <T extends FilterType>(results: T[], tPost: Translations) => {
  return results
    .filter((result) => result.post !== 'total')
    .reduce(
      (acc, result) => {
        if (!result.post || !result.children) {
          return acc
        }

        acc[result.post] = {
          id: result.post,
          name: result.label,
          children: result.children.map((subPost) => ({
            id: subPost.post ?? '',
            label: subPost.post ? tPost(subPost.post) : subPost.label,
          })),
        }
        return acc
      },
      {} as Record<string, { id: string; name: string; children: ChildrenType[] }>,
    )
}

const getResultId = (result: BasicTypeCharts['children'][number]) => {
  return (result.post ? result.post : result.label) ?? ''
}

interface Props<T> {
  setFilteredResults: (results: T[]) => void
  results: T[]
  type: 'tag' | 'post'
  anchorEl: HTMLElement | null
  onClose: () => void
  exportType?: string
}
const Filters = <T extends FilterType>({
  setFilteredResults,
  results,
  type,
  anchorEl,
  onClose,
  exportType,
}: Props<T>) => {
  const tPost = useTranslations('emissionFactors.post')
  const [previousExportType, setPreviousExportType] = useState<string | null>(null)

  const initialItems = useMemo(() => {
    switch (type) {
      case 'tag':
        return getTagItems(results)
      case 'post':
        return getPostItems(results, tPost)
      default:
        return {} as Record<string, { id: string; name: string; children: ChildrenType[] }>
    }
  }, [results, type, tPost])

  const [checkedItems, setCheckedItems] = useState<string[]>([])

  useEffect(() => {
    if (initialItems && previousExportType !== exportType) {
      setPreviousExportType(exportType ?? null)
      const defaultItems = Object.values(initialItems).flatMap((parent) => parent.children.map((child) => child.id))
      setCheckedItems(defaultItems)
    }
  }, [initialItems, previousExportType, exportType])

  useEffect(() => {
    const filtered = results
      .map((result) => {
        const filteredChildren = result.children.filter((child) => checkedItems.includes(getResultId(child)))
        const newTotal = filteredChildren.reduce((sum, child) => sum + child.value, 0)

        return {
          ...result,
          value: newTotal,
          children: filteredChildren,
        }
      })
      .filter((result) => {
        if (result.post === 'total') {
          return true
        }
        return result.children.some((child) => checkedItems.includes(getResultId(child)))
      })

    setFilteredResults(filtered)
  }, [checkedItems, results, setFilteredResults])

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
    >
      <div className={classNames(styles.filters, 'px1')}>
        {Object.entries(initialItems).map(([parentId, familyInfo]) => {
          return (
            <div className="flex flex-col" key={parentId}>
              <FormControlLabel
                label={familyInfo.name}
                control={
                  <Checkbox
                    checked={initialItems[parentId].children.some((child) => checkedItems.includes(child.id))}
                    onChange={() =>
                      setCheckedItems((prevCheckedItems) => {
                        if (
                          initialItems[parentId].children.every((child) =>
                            prevCheckedItems.find((ci) => ci === child.id),
                          )
                        ) {
                          return prevCheckedItems.filter(
                            (ci) => !initialItems[parentId].children.some((child) => child.id === ci),
                          )
                        }

                        const newCheckedItems = [...prevCheckedItems]
                        for (const child of initialItems[parentId].children) {
                          if (!newCheckedItems.includes(child.id)) {
                            newCheckedItems.push(child.id)
                          }
                        }
                        return newCheckedItems
                      })
                    }
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
                      checked={checkedItems.some((el) => el === child.id)}
                      onChange={() =>
                        setCheckedItems((prevCheckedItems) => {
                          if (prevCheckedItems.includes(child.id)) {
                            return prevCheckedItems.filter((ci) => ci !== child.id)
                          }
                          return [...prevCheckedItems, child.id]
                        })
                      }
                    />
                  }
                />
              ))}
            </div>
          )
        })}
      </div>
    </Menu>
  )
}

export default Filters
