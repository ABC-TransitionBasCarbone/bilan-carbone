import { Checkbox, FormControlLabel } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'

const getTagFilters = <T extends { label?: string; tagFamily?: { id: string; name: string } }>(results: T[]) => {
  return results.reduce(
    (acc, result) => {
      if (result.label && result.tagFamily) {
        if (acc[result.tagFamily.id]) {
          acc[result.tagFamily.id].tags.push(result.label)
        } else {
          acc[result.tagFamily.id] = { name: result.tagFamily.name, tags: [result.label] }
        }
      }
      return acc
    },
    {} as Record<string, { name: string; tags: string[] }>,
  )
}

interface Props<T> {
  setFilteredResults: (results: T[]) => void
  results: T[]
  type: 'tag' | 'post'
  display: boolean
}
const Filters = <T extends { value: number; label: string; post?: string; tagFamily?: { id: string; name: string } }>({
  setFilteredResults,
  results,
  type,
  display,
}: Props<T>) => {
  const initialFilters = useMemo(() => {
    switch (type) {
      case 'tag':
        return getTagFilters(results)
      default:
        return {} as Record<string, { name: string; tags: string[] }>
    }
    // We only want to compute the filters once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [checkedItems, setCheckedItems] = useState(
    Object.values(initialFilters).flatMap((family) => family.tags.map((tag) => tag)),
  )

  useEffect(() => {
    setFilteredResults(results.filter((result) => checkedItems.includes(result.label)))
  }, [checkedItems, results, setFilteredResults])

  if (!display) {
    return null
  }

  return (
    <>
      {Object.entries(initialFilters).map(([familyId, familyInfo]) => {
        return (
          <div className="flex flex-col" key={familyId}>
            <FormControlLabel
              label={familyInfo.name}
              control={
                <Checkbox
                  checked={initialFilters[familyId].tags.every((tag) => checkedItems.find((ci) => ci === tag))}
                  onChange={() =>
                    setCheckedItems((prevCheckedItems) => {
                      if (initialFilters[familyId].tags.every((tag) => prevCheckedItems.find((ci) => ci === tag))) {
                        return prevCheckedItems.filter((ci) => !initialFilters[familyId].tags.includes(ci))
                      }

                      const newCheckedItems = [...prevCheckedItems]
                      for (const tag of initialFilters[familyId].tags) {
                        if (!newCheckedItems.includes(tag)) {
                          newCheckedItems.push(tag)
                        }
                      }
                      return newCheckedItems
                    })
                  }
                />
              }
            />
            {familyInfo.tags.map((tag) => (
              <FormControlLabel
                className="ml2"
                key={tag}
                label={tag}
                control={
                  <Checkbox
                    checked={checkedItems.includes(tag)}
                    onChange={() =>
                      setCheckedItems((prevCheckedItems) => {
                        if (prevCheckedItems.includes(tag)) {
                          return prevCheckedItems.filter((ci) => ci !== tag)
                        }
                        return [...prevCheckedItems, tag]
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
