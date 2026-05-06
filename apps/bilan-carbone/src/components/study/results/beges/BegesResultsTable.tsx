'use client'

import BaseTable from '@/components/base/Table'
import type { FullStudy } from '@/db/study'
import { rulesSpans } from '@/services/results/beges'
import { PostInfos } from '@/services/results/exports'
import { getConfidenceInterval, getQualitativeUncertaintyFromSquaredStandardDeviation } from '@/services/uncertainty'
import { formatConfidenceInterval, formatEmission, STUDY_UNIT_VALUES } from '@/utils/study'
import { Export } from '@abc-transitionbascarbone/db-common/enums'
import { Cell, ColumnDef, getCoreRowModel, Row, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import TotalCarbonExport from '../consolidated/TotalCarbonExport'
import { TableRow } from '../ExportResultsTable'
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
  const tResults = useTranslations('study.results')

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
        { header: 'CO2', accessorKey: 'co2', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        { header: 'CH4', accessorKey: 'ch4', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        { header: 'N20', accessorKey: 'n2o', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        {
          header: t('other'),
          accessorKey: 'other',
          cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit),
        },
        {
          header: t('total'),
          accessorKey: 'total',
          cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit),
        },
        { header: 'CO2b', accessorKey: 'co2b', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        {
          id: 'uncertainty',
          header: t('uncertainty'),
          accessorFn: ({ squaredStandardDeviation }) =>
            squaredStandardDeviation
              ? tQuality(getQualitativeUncertaintyFromSquaredStandardDeviation(squaredStandardDeviation).toString())
              : '',
        },
        {
          id: 'confidenceInterval',
          header: tResults('confidenceIntervalTitle'),
          accessorFn: ({ total, squaredStandardDeviation }) => {
            const confidenceInterval = getConfidenceInterval(total, squaredStandardDeviation)
            return formatConfidenceInterval(confidenceInterval, study.resultsUnit)
          },
        },
      ] as ColumnDef<PostInfos>[],
    [t, study.resultsUnit, tResults, tQuality],
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  const getCellClass = (row: Row<PostInfos>, cell: Cell<PostInfos, unknown>, isTotal: boolean) => {
    let cellClass = ''
    const isSubtotal = row.original.rule.includes('.total')
    const isTotalColumn = cell.column.id === 'total'

    if (cell.column.id === 'category') {
      cellClass = `${styles.categoryCell} ${commonStyles.categoryBold}`
    } else if (isTotal) {
      cellClass = `${styles.totalRow} ${commonStyles.categoryBold}`
    } else if (isSubtotal) {
      cellClass = `${styles.postCell} ${commonStyles.subtotalRow}`
    } else {
      cellClass = styles.postCell
    }

    if (isTotalColumn) {
      cellClass += ` ${commonStyles.totalColumn}`
    }
    return cellClass
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
        customRow={(row: Row<PostInfos>) => TableRow(row, getCellClass, rulesSpans, 'beges')}
        testId="beges-results"
        size="small"
        firstHeader={<div>{t('ges', { unit: tUnits(study.resultsUnit) })}</div>}
      />
    </>
  )
}

export default BegesResultsTable
