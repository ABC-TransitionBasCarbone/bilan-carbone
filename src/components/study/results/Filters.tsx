import { BasicTypeCharts } from '@/utils/charts'
import { Checkbox, FormControlLabel } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

type FilterType = BasicTypeCharts & { familyId?: string }
type ChildrenType = { id: string; label: string }

const getTagFilters = <T extends FilterType>(results: T[]) => {
  return results.reduce(
    (acc, result) => {
      if (!result.familyId || !result.children) {
        return acc
      }

      acc[result.familyId] = {
        id: result.familyId,
        name: result.label,
        children: result.children.map((tag) => ({ id: tag.label, label: tag.label })),
      }

      return acc
    },
    {} as Record<string, { id: string; name: string; children: ChildrenType[] }>,
  )
}

const getPostFilters = <T extends FilterType>(results: T[], tPost: ReturnType<typeof useTranslations>) => {
  return results.reduce(
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
  display: boolean
}
const Filters = <T extends FilterType>({ setFilteredResults, results, type, display }: Props<T>) => {
  const tPost = useTranslations('emissionFactors.post')

  const initialFilters = useMemo(() => {
    switch (type) {
      case 'tag':
        return getTagFilters(results)
      case 'post':
        return getPostFilters(results, tPost)
      default:
        return {} as Record<string, { id: string; name: string; children: ChildrenType[] }>
    }
  }, [results, type, tPost])

  const [checkedItems, setCheckedItems] = useState(() =>
    Object.values(initialFilters).flatMap((parent) => parent.children.map((child) => child.id)),
  )

  useEffect(() => {
    setCheckedItems(Object.values(initialFilters).flatMap((parent) => parent.children.map((child) => child.id)))
  }, [initialFilters])

  useEffect(() => {
    const filtered = results
      .map((result) => {
        const filteredChildren = result.children.filter((child) => checkedItems.includes(getResultId(child)))

        if (filteredChildren.length === 0) {
          return null
        }

        const newTotal = filteredChildren.reduce((sum, child) => sum + child.value, 0)

        return {
          ...result,
          value: newTotal,
          children: filteredChildren,
        }
      })
      .filter((result) => result !== null)

    setFilteredResults(filtered)
  }, [checkedItems, results, setFilteredResults])

  if (!display) {
    return null
  }

  return (
    <>
      {Object.entries(initialFilters).map(([parentId, familyInfo]) => {
        return (
          <div className="flex flex-col" key={parentId}>
            <FormControlLabel
              label={familyInfo.name}
              control={
                <Checkbox
                  checked={initialFilters[parentId].children.some((child) =>
                    checkedItems.find((ci) => ci === child.id),
                  )}
                  onChange={() =>
                    setCheckedItems((prevCheckedItems) => {
                      if (
                        initialFilters[parentId].children.every((child) =>
                          prevCheckedItems.find((ci) => ci === child.id),
                        )
                      ) {
                        return prevCheckedItems.filter(
                          (ci) => !initialFilters[parentId].children.some((child) => child.id === ci),
                        )
                      }

                      const newCheckedItems = [...prevCheckedItems]
                      for (const child of initialFilters[parentId].children) {
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
    </>
  )
}

export default Filters
