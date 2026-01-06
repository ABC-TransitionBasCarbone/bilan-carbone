'use client'

import BaseTable from '@/components/base/Table'
import { Post } from '@/services/posts'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { sortByCustomOrder } from '@/utils/array'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { StudyResultUnit } from '@prisma/client'
import { ColumnDef, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import commonStyles from '../commonTable.module.css'

interface Props<T> {
  resultsUnit: StudyResultUnit
  data: T[]
  hiddenUncertainty?: boolean
  expandAll?: boolean
  hideExpandIcons?: boolean
  isCompact?: boolean
  customPostOrder?: Post[]
}

type tableDataType = {
  label: string
  value: number
  uncertainty: number
  post: string
  children: tableDataType[]
}

const ConsolidatedResultsTable = <
  T extends {
    value: number
    label: string
    uncertainty: number
    post: string
    children: { value: number; label: string; uncertainty: number; post: string }[]
  },
>({
  resultsUnit,
  data,
  hiddenUncertainty,
  expandAll,
  hideExpandIcons,
  isCompact,
  customPostOrder,
}: Props<T>) => {
  const t = useTranslations('study.results')
  const tQuality = useTranslations('quality')
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')

  const columns = useMemo(() => {
    const tmpColumns = [
      {
        header: t('post'),
        accessorFn: ({ post }) => tPost(post),
        cell: ({ row, getValue }) => {
          if (hideExpandIcons) {
            const isSubpost = row.depth > 0
            return (
              <p
                className={classNames(
                  'align-center',
                  isSubpost ? `${commonStyles.notExpandable} pl1` : commonStyles.expandable,
                )}
              >
                {getValue<string>()}
              </p>
            )
          }

          return row.getCanExpand() ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className={classNames('align-center', commonStyles.expandable)}
            >
              {row.getIsExpanded() ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
              {getValue<string>()}
            </button>
          ) : (
            <p className={classNames('align-center', commonStyles.notExpandable, { pl1: row.depth > 0 })}>
              {getValue<string>()}
            </p>
          )
        },
      },
    ] as ColumnDef<tableDataType>[]

    if (!hiddenUncertainty) {
      tmpColumns.push({
        header: t('uncertainty'),
        accessorFn: ({ uncertainty }) =>
          uncertainty ? tQuality(getStandardDeviationRating(uncertainty).toString()) : '',
      })
    }

    tmpColumns.push({
      header: t('value', { unit: tUnits(resultsUnit) }),
      accessorKey: 'value',
      cell: ({ getValue }) => (
        <p className={commonStyles.number}>{formatNumber(getValue<number>() / STUDY_UNIT_VALUES[resultsUnit])}</p>
      ),
    })

    return tmpColumns
  }, [hiddenUncertainty, hideExpandIcons, resultsUnit, t, tPost, tQuality, tUnits])

  const tableData = useMemo(() => {
    const mappedData = data.map((d) => ({
      ...d,
      children: d.children.map((child) => ({ ...child, children: [] })),
    }))

    if (customPostOrder?.length) {
      return sortByCustomOrder(mappedData, customPostOrder, (item) => item.post ?? item.label)
    }
    return mappedData
  }, [data])

  const table = useReactTable({
    columns,
    data: tableData,
    getSubRows: (row) => row.children,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    initialState: expandAll ? { expanded: true } : undefined,
  })

  return (
    <BaseTable
      table={table}
      className={classNames(commonStyles.headers, { [commonStyles.compact]: isCompact })}
      testId="consolidated-results"
      size="small"
    />
  )
}

export default ConsolidatedResultsTable
