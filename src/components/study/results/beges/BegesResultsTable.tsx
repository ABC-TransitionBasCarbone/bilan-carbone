'use client'

import BaseTable from '@/components/base/Table'
import { FullStudy } from '@/db/study'
import { BegesPostInfos, rulesSpans } from '@/services/results/beges'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { ColumnDef, flexRender, getCoreRowModel, Row, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import TotalCarbonBeges from '../consolidated/TotalCarbonBeges'
import styles from './BegesResultsTable.module.css'

interface Props {
  study: FullStudy
  withDepValue: number
  data: BegesPostInfos[]
}

const BegesResultsTable = ({ study, withDepValue, data }: Props) => {
  const t = useTranslations('beges')
  const tQuality = useTranslations('quality')
  const tUnits = useTranslations('study.results.units')

  const columns = useMemo(
    () =>
      [
        {
          id: 'category',
          header: t('category.title'),
          accessorFn: ({ rule }) => {
            const category = rule.split('.')[0]
            return category === 'total' ? '' : `${category}. ${t(`category.${category}`)}`
          },
        },
        {
          id: 'post',
          header: t('post.title'),
          accessorFn: ({ rule }) => {
            if (rule === 'total') {
              return t('total')
            }
            return rule.includes('.total') ? t('subTotal') : `${rule}. ${t(`post.${rule}`)}`
          },
        },
        {
          header: t('ges', { unit: tUnits(study.resultsUnit) }),
          columns: [
            {
              header: 'CO2',
              accessorKey: 'co2',
              cell: ({ getValue }) => formatNumber(getValue<number>() / STUDY_UNIT_VALUES[study.resultsUnit]),
            },
            {
              header: 'CH4',
              accessorKey: 'ch4',
              cell: ({ getValue }) => formatNumber(getValue<number>() / STUDY_UNIT_VALUES[study.resultsUnit]),
            },
            {
              header: 'N20',
              accessorKey: 'n2o',
              cell: ({ getValue }) => formatNumber(getValue<number>() / STUDY_UNIT_VALUES[study.resultsUnit]),
            },
            {
              header: t('other'),
              accessorKey: 'other',
              cell: ({ getValue }) => formatNumber(getValue<number>() / STUDY_UNIT_VALUES[study.resultsUnit]),
            },
            {
              header: t('total'),
              accessorKey: 'total',
              cell: ({ getValue }) => formatNumber(getValue<number>() / STUDY_UNIT_VALUES[study.resultsUnit]),
            },
            {
              header: 'CO2b',
              accessorKey: 'co2b',
              cell: ({ getValue }) => formatNumber(getValue<number>() / STUDY_UNIT_VALUES[study.resultsUnit]),
            },
          ],
        },
        {
          id: 'uncertainty',
          header: t('uncertainty'),
          accessorFn: ({ uncertainty }) =>
            uncertainty ? tQuality(getStandardDeviationRating(uncertainty).toString()) : '',
        },
      ] as ColumnDef<BegesPostInfos>[],
    [t, tQuality, tUnits, study.resultsUnit],
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  const Row = (row: Row<BegesPostInfos>) => {
    const rule = row.original.rule.split('.')
    const category = rule[0]
    const isTotal = category === 'total'
    const isCategorieFirstRow = rule[1] === '1' || isTotal

    return (
      <tr
        key={row.id}
        data-testid="beges-results-table-row"
        data-category={category}
        className={isCategorieFirstRow ? styles.categoryFirstRow : ''}
      >
        {row.getVisibleCells().map((cell) => {
          const shouldRenderCell = cell.column.id !== 'category' || isCategorieFirstRow

          if (!shouldRenderCell) {
            return null
          }

          let cellClass = ''
          const isSubtotal = row.original.rule.includes('.total')
          const isTotalColumn = cell.column.id === 'total'

          if (cell.column.id === 'category') {
            cellClass = `${styles.categoryCell} ${styles.categoryBold}`
          } else if (isTotal) {
            cellClass = styles.totalRow
          } else if (isSubtotal) {
            cellClass = `${styles.postCell} ${styles.subtotalRow}`
          } else {
            cellClass = styles.postCell
          }

          if (isTotalColumn) {
            cellClass += ` ${styles.totalColumn}`
          }

          return (
            <td
              key={cell.id}
              rowSpan={cell.column.id === 'category' ? rulesSpans[category] : undefined}
              className={cellClass}
              data-category={category}
            >
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          )
        })}
      </tr>
    )
  }

  return (
    <>
      <TotalCarbonBeges
        resultUnit={study.resultsUnit}
        totalBeges={(data.find((d) => d.rule === 'total')?.total ?? 0) / STUDY_UNIT_VALUES[study.resultsUnit]}
        totalCarbon={withDepValue}
      />
      <BaseTable table={table} className={styles.begesTable} customRow={Row} testId="beges-results" size="small" />
    </>
  )
}

export default BegesResultsTable
