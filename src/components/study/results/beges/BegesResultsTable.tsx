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
    const validatedOnlySetting = (await getUserSettings())?.validatedEmissionSourcesOnly
    if (validatedOnlySetting !== undefined) {
      setValidatedOnly(validatedOnlySetting)
    }
  }

  const columns = useMemo(
    () =>
      [
        {
          header: t('rule'),
          columns: [
            {
              id: 'category',
              header: t('category.title'),
              accessorFn: ({ rule }) => {
                const category = rule.split('.')[0]
                return category === 'total' ? '' : `${category}. ${t(`category.${category}`)}`
              },
            },
            {
              header: t('post.title'),
              accessorFn: ({ rule }) => {
                if (rule === 'total') {
                  return t('total')
                }
                return rule.includes('.total') ? t('subTotal') : `${rule}. ${t(`post.${rule}`)}`
              },
            },
          ],
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
            {
              header: t('uncertainty'),
              accessorFn: ({ uncertainty }) =>
                uncertainty ? tQuality(getStandardDeviationRating(uncertainty).toString()) : '',
            },
          ],
        },
      ] as ColumnDef<BegesLine>[],
    [t, tQuality],
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
      <table aria-labelledby="study-rights-table-title">
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
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} data-testid="beges-results-table-row">
              {row.getVisibleCells().map((cell) => {
                const rule = row.original.rule.split('.')
                return cell.column.id !== 'category' || rule[1] === '1' || rule[0] === 'total' ? (
                  <td key={cell.id} rowSpan={cell.column.id === 'category' ? rulesSpans[rule[0]] : undefined}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ) : null
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default BegesResultsTable
