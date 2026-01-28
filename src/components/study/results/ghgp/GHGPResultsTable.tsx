'use client'

import BaseTable from '@/components/base/Table'
import { FullStudy } from '@/db/study'
import { PostInfos } from '@/services/results/exports'
import { rulesSpans } from '@/services/results/ghgp'
import { getConfidenceInterval } from '@/services/uncertainty'
import { getGHGPRuleName } from '@/utils/ghgp'
import { formatEmission, formatEmissionFromNumber, STUDY_UNIT_VALUES } from '@/utils/study'
import { EmissionFactorBase, Export } from '@prisma/client'
import { Cell, ColumnDef, getCoreRowModel, Row, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import TotalCarbonExport from '../consolidated/TotalCarbonExport'
import { TableRow } from '../ExportResultsTable'
import commonStyles from '../ExportResultsTable.module.css'
import styles from './GHGPResultsTable.module.css'

interface Props {
  study: FullStudy
  withDepValue: number
  data: PostInfos[]
  base: EmissionFactorBase
}

const GHGPResultsTable = ({ study, withDepValue, data, base }: Props) => {
  const t = useTranslations('ghgp')
  const tUnits = useTranslations('study.results.units')
  const tStudyResults = useTranslations('study.results')

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
            const prefix = getGHGPRuleName(rule)
            return rule.includes('.total') ? t('subTotal') : `${prefix} ${t(`post.${rule}`)}`
          },
        },
        { header: 'CO2', accessorKey: 'co2', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        { header: 'CH4', accessorKey: 'ch4', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        { header: 'N20', accessorKey: 'n2o', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        { header: 'HFC', accessorKey: 'hfc', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        { header: 'PFC', accessorKey: 'pfc', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        { header: 'SF6', accessorKey: 'sf6', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        {
          header: t('total'),
          accessorKey: 'total',
          cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit),
        },
        { header: 'CO2b', accessorKey: 'co2b', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
        {
          id: 'confidenceInterval',
          header: tStudyResults('confidenceIntervalTitle'),
          accessorFn: ({ total, squaredStandardDeviation }) => {
            const confidenceInterval = getConfidenceInterval(total, squaredStandardDeviation)
            return `[${formatEmissionFromNumber(confidenceInterval[0], study.resultsUnit)};
                                  ${formatEmissionFromNumber(confidenceInterval[1], study.resultsUnit)}]`
          },
        },
      ] as ColumnDef<PostInfos>[],
    [t, tStudyResults, study.resultsUnit],
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
      if (!isTotal) {
        cellClass += ` ${styles.totalColumn}`
      }
    }
    return cellClass
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
        className={classNames(
          commonStyles.Table,
          base === EmissionFactorBase.LocationBased ? styles.ghgpTable : styles.ghgpTableComplementary,
        )}
        customRow={(row: Row<PostInfos>) => TableRow(row, getCellClass, rulesSpans, 'ghgp')}
        testId="ghgp-results"
        size="small"
        firstHeader={<div>{t('ges', { unit: tUnits(study.resultsUnit) })}</div>}
      />
    </>
  )
}

export default GHGPResultsTable
