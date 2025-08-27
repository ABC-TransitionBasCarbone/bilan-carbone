'use client'

import { getStandardDeviationRating } from '@/services/uncertainty'
import { BasicTypeCharts } from '@/utils/charts'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { StudyResultUnit } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
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
}

const ConsolidatedResultsTable = <
  T extends BasicTypeCharts & { uncertainty: number; post: string; children: Omit<T, 'children'>[] },
>({
  resultsUnit,
  data,
  hiddenUncertainty,
  expandAll,
  hideExpandIcons,
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
    ] as ColumnDef<T>[]

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

  const table = useReactTable({
    columns,
    data: data,
    // getSubRows: (row) => ({ ...row.children, children: [] as T[] }),
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    initialState: expandAll ? { expanded: true } : undefined,
  })

  return (
    <table aria-labelledby="study-rights-table-title">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} className={commonStyles.header}>
                {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} data-testid="consolidated-results-table-row">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default ConsolidatedResultsTable
