'use client'

import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { BegesLine, computeBegesResult, rulesSpans } from '@/services/results/beges'
import { getUserSettings } from '@/services/serverFunctions/user'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { ExportRule } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import styles from './BegesResultsTable.module.css'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  studySite: string
  withDependencies: boolean
}

const BegesResultsTable = ({ study, rules, emissionFactorsWithParts, studySite, withDependencies }: Props) => {
  const t = useTranslations('beges')
  const tQuality = useTranslations('quality')
  const tUnits = useTranslations('study.results.units')
  const [validatedOnly, setValidatedOnly] = useState(true)

  useEffect(() => {
    applyUserSettings()
  }, [])

  const applyUserSettings = async () => {
    const userSettings = await getUserSettings()
    const validatedOnlySetting = userSettings.success ? userSettings.data?.validatedEmissionSourcesOnly : undefined
    if (validatedOnlySetting !== undefined) {
      setValidatedOnly(validatedOnlySetting)
    }
  }

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
      ] as ColumnDef<BegesLine>[],
    [t, tQuality, tUnits, study.resultsUnit],
  )

  const data = useMemo(
    () => computeBegesResult(study, rules, emissionFactorsWithParts, studySite, withDependencies, validatedOnly),
    [study, rules, emissionFactorsWithParts, studySite, withDependencies, validatedOnly],
  )

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <table className={styles.begesTable} aria-labelledby="study-rights-table-title">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
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
          })}
        </tbody>
      </table>
    </>
  )
}

export default BegesResultsTable
