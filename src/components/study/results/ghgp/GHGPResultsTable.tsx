'use client'

import BaseTable from '@/components/base/Table'
import { FullStudy } from '@/db/study'
import { PostInfos } from '@/services/results/exports'
import { rulesSpans } from '@/services/results/ghgp'
import { formatEmission, STUDY_UNIT_VALUES } from '@/utils/study'
import { Export } from '@prisma/client'
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
}

const GHGPResultsTable = ({ study, withDepValue, data }: Props) => {
  const t = useTranslations('ghgp')
  const tUnits = useTranslations('study.results.units')

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
            /**
             * The structure is not designed to handle 3.X rules separated into two scopes.
             * So it's separated into 3.X and 4.X and then corrected them to display what we want.
             * That way, the processing is done automatically (cf allRules).
             */
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
          columns: [
            { header: 'CO2', accessorKey: 'co2', cell: ({ getValue }) => formatEmission(getValue, study.resultsUnit) },
          ],
        },
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
      ] as ColumnDef<PostInfos>[],
    [t, tUnits, study.resultsUnit],
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
    const isCO2bColumn = cell.column.id === 'co2b'

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

    if (isCO2bColumn && !isTotal) {
      cellClass += ` ${styles.co2bColumn}`
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
        className={classNames(commonStyles.Table, styles.ghgpTable)}
        customRow={(row: Row<PostInfos>) => TableRow(row, getCellClass, rulesSpans, 'ghgp')}
        testId="ghgp-results"
        size="small"
      />
    </>
  )
}

export default GHGPResultsTable
