'use client'

import BaseTable from '@/components/base/Table'
import { FullStudy } from '@/db/study'
import { rulesSpans } from '@/services/results/beges'
import { PostInfos } from '@/services/results/exports'
import { getQualitativeUncertaintyFromSquaredStandardDeviation } from '@/services/uncertainty'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Export } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, Getter, Row, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import TotalCarbonExport from '../consolidated/TotalCarbonExport'
import commonStyles from '../ExportResultsTable.module.css'
import styles from './BegesResultsTable.module.css'

interface Props {
  study: FullStudy
  withDepValue: number
  data: PostInfos[]
}

const BegesResultsTable = ({ study, withDepValue, data }: Props) => {
  const t = useTranslations('beges')
  const tQuality = useTranslations('quality')
  const tUnits = useTranslations('study.results.units')

  const formatEmission = useCallback(
    (getValue: Getter<number>) => formatNumber(getValue() / STUDY_UNIT_VALUES[study.resultsUnit]),
    [study.resultsUnit],
  )

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
          columns: [{ header: 'CO2', accessorKey: 'co2', cell: ({ getValue }) => formatEmission(getValue) }],
        },
        { header: 'CH4', accessorKey: 'ch4', cell: ({ getValue }) => formatEmission(getValue) },
        { header: 'N20', accessorKey: 'n2o', cell: ({ getValue }) => formatEmission(getValue) },
        { header: t('other'), accessorKey: 'other', cell: ({ getValue }) => formatEmission(getValue) },
        { header: t('total'), accessorKey: 'total', cell: ({ getValue }) => formatEmission(getValue) },
        { header: 'CO2b', accessorKey: 'co2b', cell: ({ getValue }) => formatEmission(getValue) },
        {
          id: 'uncertainty',
          header: t('uncertainty'),
          accessorFn: ({ squaredStandardDeviation }) =>
            squaredStandardDeviation
              ? tQuality(getQualitativeUncertaintyFromSquaredStandardDeviation(squaredStandardDeviation).toString())
              : '',
        },
      ] as ColumnDef<PostInfos>[],
    [t, tUnits, tQuality, study.resultsUnit, formatEmission],
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  const Row = (row: Row<PostInfos>) => {
    const rule = row.original.rule.split('.')
    const category = rule[0]
    const isTotal = category === 'total'
    const isCategorieFirstRow = rule[1] === '1' || isTotal

    return (
      <tr
        key={row.id}
        data-testid="beges-results-table-row"
        data-category={category}
        className={isCategorieFirstRow ? commonStyles.categoryFirstRow : ''}
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
            cellClass = `${styles.categoryCell} ${commonStyles.categoryBold}`
          } else if (isTotal) {
            cellClass = styles.totalRow
          } else if (isSubtotal) {
            cellClass = `${styles.postCell} ${commonStyles.subtotalRow}`
          } else {
            cellClass = styles.postCell
          }

          if (isTotalColumn) {
            cellClass += ` ${commonStyles.totalColumn}`
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
      <TotalCarbonExport
        type={Export.Beges}
        resultUnit={study.resultsUnit}
        total={(data.find((d) => d.rule === 'total')?.total ?? 0) / STUDY_UNIT_VALUES[study.resultsUnit]}
        totalCarbon={withDepValue}
      />
      <BaseTable
        table={table}
        className={classNames(commonStyles.Table, styles.begesTable)}
        customRow={Row}
        testId="beges-results"
        size="small"
      />
    </>
  )
}

export default BegesResultsTable
