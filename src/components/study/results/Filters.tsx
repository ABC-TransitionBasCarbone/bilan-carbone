import { BasicTypeCharts } from '@/utils/charts'
import { Checkbox, FormControlLabel } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

type FilterType = BasicTypeCharts & { familyId?: string; subPosts?: { post: SubPost }[] }
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
      if (!result.post || !result.subPosts) {
        return acc
      }

      acc[result.post] = {
        id: result.post,
        name: result.label,
        children: result.subPosts.map((subPost) => ({ id: subPost.post, label: tPost(subPost.post) })),
      }
      return acc
    },
    {} as Record<string, { id: string; name: string; children: ChildrenType[] }>,
  )
}

const getResultId = <T extends FilterType>(result: T) => {
  return (result.familyId ? result.familyId : result.post) ?? ''
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
    // We only want to compute the filters once when the component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const [checkedItems, setCheckedItems] = useState(Object.values(initialFilters).flatMap((parent) => parent.id))

  useEffect(() => {
    console.log(
      results,
      checkedItems,
      results.filter((result) => checkedItems.includes(getResultId(result))),
    )
    setFilteredResults(results.filter((result) => checkedItems.includes(getResultId(result))))
  }, [checkedItems, results, setFilteredResults])

  if (!display) {
    return null
  }

  return (
    <>
      {Object.entries(initialFilters).map(([parentId, familyInfo]) => {
        return (
          <FormControlLabel
            key={parentId}
            label={familyInfo.name}
            control={
              <Checkbox
                checked={checkedItems.includes(parentId)}
                onChange={() =>
                  setCheckedItems((prevCheckedItems) => {
                    if (prevCheckedItems.includes(parentId)) {
                      return prevCheckedItems.filter((ci) => ci !== parentId)
                    }

                    return [...prevCheckedItems, parentId]
                  })
                }
              />
            }
          />
          // <div className="flex flex-col" key={parentId}>
          //   <FormControlLabel
          //     label={familyInfo.name}
          //     control={
          //       <Checkbox
          //         checked={initialFilters[parentId].children.every((child) =>
          //           checkedItems.find((ci) => ci.label === child.label),
          //         )}
          //         onChange={() =>
          //           setCheckedItems((prevCheckedItems) => {
          //             if (
          //               initialFilters[parentId].children.every((child) =>
          //                 prevCheckedItems.find((ci) => ci.label === child.label),
          //               )
          //             ) {
          //               return prevCheckedItems.filter(
          //                 (ci) => !initialFilters[parentId].children.some((child) => child.label === ci.label),
          //               )
          //             }

          //             const newCheckedItems = [...prevCheckedItems]
          //             for (const child of initialFilters[parentId].children) {
          //               if (!newCheckedItems.includes(child)) {
          //                 newCheckedItems.push(child)
          //               }
          //             }
          //             return newCheckedItems
          //           })
          //         }
          //       />
          //     }
          //   />
          //   {familyInfo.children.map((child) => (
          //     <FormControlLabel
          //       className="ml2"
          //       key={child.label}
          //       label={child.label}
          //       control={
          //         <Checkbox
          //           checked={checkedItems.some((el) => el.label === child.label)}
          //           onChange={() =>
          //             setCheckedItems((prevCheckedItems) => {
          //               if (prevCheckedItems.includes(child)) {
          //                 return prevCheckedItems.filter((ci) => ci.label !== child.label)
          //               }
          //               return [...prevCheckedItems, child]
          //             })
          //           }
          //         />
          //       }
          //     />
          //   ))}
          // </div>
        )
      })}
    </>
  )
}

export default Filters
