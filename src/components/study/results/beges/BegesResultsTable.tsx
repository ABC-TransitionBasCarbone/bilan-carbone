'use client'

import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { BegesLine, computeBegesResult, rulesSpans } from '@/services/results/beges'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { ExportRule } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  site: string
  withDependencies: boolean
}

const BegesResultsTable = ({ study, rules, emissionFactorsWithParts, site, withDependencies }: Props) => {
  const t = useTranslations('beges')
  const tQuality = useTranslations('quality')

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
          header: t('ges'),
          columns: [
            { header: 'CO2', accessorKey: 'co2' },
            { header: 'CH4', accessorKey: 'ch4' },
            { header: 'N20', accessorKey: 'n2o' },
            { header: t('other'), accessorKey: 'other' },
            { header: t('total'), accessorKey: 'total' },
            { header: 'CO2b', accessorKey: 'co2b' },
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
    () => computeBegesResult(study, rules, emissionFactorsWithParts, site, withDependencies),
    [study, rules, emissionFactorsWithParts, site, withDependencies],
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
