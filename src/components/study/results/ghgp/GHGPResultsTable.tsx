'use client'

import BaseTable from '@/components/base/Table'
import { FullStudy } from '@/db/study'
import { PostInfos } from '@/services/results/exports'
import { rulesSpans } from '@/services/results/ghgp'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Export } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, Getter, Row, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo } from 'react'
import TotalCarbonExport from '../consolidated/TotalCarbonExport'
import commonStyles from '../ExportResultsTable.module.css'
import styles from './GHGPResultsTable.module.css'

interface Props {
  study: FullStudy
  withDepValue: number
  data: PostInfos[]
}

const GHGPResultsTable = ({ study, withDepValue, data }: Props) => {
  const t = useTranslations('ghgp')
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
            return category === 'total' ? '' : t(`category.${category}`)
          },
        },
        {
          id: 'post',
          header: t('post.title'),
          accessorFn: ({ rule }) => {
            if (rule === 'total') {
              return t('total')
            }
            let prefix = `${rule} - `
            if (prefix.substring(0, 1) === '4') {
              prefix = `3${prefix.substring(1)}`
            }
            // specific case 3.09 (0 is added to put it before 3.10)
            if (prefix.substring(2, 3) === '0') {
              prefix = `3.${prefix.substring(3)}`
            }
            if (prefix.split('.')[1].includes('other')) {
              prefix = ''
            }
            return rule.includes('.total') ? t('subTotal') : `${prefix}${t(`post.${rule}`)}`
          },
        },
        {
          header: t('ges', { unit: tUnits(study.resultsUnit) }),
          columns: [{ header: 'CO2', accessorKey: 'co2', cell: ({ getValue }) => formatEmission(getValue) }],
        },
        { header: 'CH4', accessorKey: 'ch4', cell: ({ getValue }) => formatEmission(getValue) },
        { header: 'N20', accessorKey: 'n2o', cell: ({ getValue }) => formatEmission(getValue) },
        { header: 'HFC', accessorKey: 'hfc', cell: ({ getValue }) => formatEmission(getValue) },
        { header: 'PFC', accessorKey: 'pfc', cell: ({ getValue }) => formatEmission(getValue) },
        { header: 'SF6', accessorKey: 'sf6', cell: ({ getValue }) => formatEmission(getValue) },
        { header: t('total'), accessorKey: 'total', cell: ({ getValue }) => formatEmission(getValue) },
        { header: 'CO2b', accessorKey: 'co2b', cell: ({ getValue }) => formatEmission(getValue) },
      ] as ColumnDef<PostInfos>[],
    [t, tUnits, study.resultsUnit, formatEmission],
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
    const isCategorieFirstRow = rule[1] === '1' || rule[1] === '09' || isTotal

    return (
      <tr
        key={row.id}
        data-testid="ghgp-results-table-row"
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
          const isCO2bColumn = cell.column.id === 'co2b'

          if (cell.column.id === 'category') {
            cellClass = `${styles.categoryCell} ${commonStyles.categoryBold}`
          } else if (isTotal) {
            cellClass = styles.totalRow
          } else if (isSubtotal) {
            cellClass = `${styles.categoryCell} ${commonStyles.subtotalRow}`
          }

          if (isTotalColumn) {
            cellClass += ` ${commonStyles.totalColumn}`
            if (!isTotal && !isSubtotal) {
              cellClass += ` ${styles.totalColumn}`
            }
          }

          if (isCO2bColumn && !isTotal && !isSubtotal) {
            cellClass += ` ${styles.co2bColumn}`
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
        type={Export.GHGP}
        resultUnit={study.resultsUnit}
        total={(data.find((d) => d.rule === 'total')?.total ?? 0) / STUDY_UNIT_VALUES[study.resultsUnit]}
        totalCarbon={withDepValue}
      />
      <BaseTable
        table={table}
        className={classNames(commonStyles.Table, styles.ghgpTable)}
        customRow={Row}
        testId="ghgp-results"
        size="small"
      />
    </>
  )
}

export default GHGPResultsTable
