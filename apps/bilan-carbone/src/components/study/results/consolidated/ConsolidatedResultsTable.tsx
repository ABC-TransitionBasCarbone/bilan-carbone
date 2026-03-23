'use client'

import BaseTable from '@/components/base/Table'
import { getConfidenceInterval, getQualitativeUncertaintyFromSquaredStandardDeviation } from '@/services/uncertainty'
import { formatConfidenceInterval, formatEmissionFromNumber } from '@/utils/study'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { StudyResultUnit } from '@repo/db-common'
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
}

type TableDataType = {
  label: string
  value: number
  post: string
  children: TableDataType[]
  squaredStandardDeviation?: number
}

const ConsolidatedResultsTable = <T extends TableDataType>({
  resultsUnit,
  data,
  hiddenUncertainty,
  expandAll,
  hideExpandIcons,
  isCompact,
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
    ] as ColumnDef<TableDataType>[]

    if (!hiddenUncertainty) {
      tmpColumns.push({
        header: t('uncertainty'),
        accessorFn: ({ squaredStandardDeviation }) =>
          squaredStandardDeviation
            ? tQuality(getQualitativeUncertaintyFromSquaredStandardDeviation(squaredStandardDeviation).toString())
            : '',
      })
    }

    tmpColumns.push({
      header: t('emissions'),
      accessorKey: 'value',
      accessorFn: ({ value }) => formatEmissionFromNumber(value, resultsUnit),
    })

    if (!hiddenUncertainty) {
      tmpColumns.push({
        id: 'confidenceInterval',
        header: t('confidenceIntervalTitle'),
        accessorFn: ({ value, squaredStandardDeviation }) => {
          // NOTE: it's assumed that if the hiddenUncertainty flag is false,
          // then the squaredStandardDeviation will be defined.
          if (squaredStandardDeviation === undefined) {
            return undefined
          }
          const confidenceInterval = getConfidenceInterval(value, squaredStandardDeviation)
          return formatConfidenceInterval(confidenceInterval, resultsUnit)
        },
        cell: ({ getValue }) => <p>{getValue<string>()}</p>,
      })
    }

    return tmpColumns
  }, [hiddenUncertainty, hideExpandIcons, resultsUnit, t, tPost, tQuality])

  const tableData = useMemo(() => {
    const mappedData = data.map((d) => ({
      ...d,
      children: d.children.map((child) => ({ ...child, children: [] })),
    }))
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
      className={classNames({ [commonStyles.compact]: isCompact })}
      testId="consolidated-results"
      size="small"
      firstHeader={<div className="text-center">{t('ges', { unit: tUnits(resultsUnit) })}</div>}
    />
  )
}

export default ConsolidatedResultsTable
