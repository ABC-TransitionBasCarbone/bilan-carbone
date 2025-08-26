import { ResultsByTag } from '@/services/results/consolidated'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { StudyResultUnit } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import commonStyles from '../commonTable.module.css'

interface Props {
  resultsUnit: StudyResultUnit
  data: ResultsByTag[]
}
const TagsResultsTable = ({ resultsUnit, data }: Props) => {
  const t = useTranslations('study.results')
  const tQuality = useTranslations('quality')

  const columns = useMemo(() => {
    return [
      {
        header: t('tag'),
        accessorFn: ({ label }) => label,
        cell: ({ getValue }) => {
          return <p className={classNames('align-center', commonStyles.notExpandable)}>{getValue<string>()}</p>
        },
      },
      {
        header: t('uncertainty'),
        accessorFn: ({ uncertainty }) =>
          uncertainty ? tQuality(getStandardDeviationRating(uncertainty).toString()) : '',
      },
      {
        header: t('emissions'),
        accessorKey: 'value',
        cell: ({ getValue }) => (
          <p className={commonStyles.number}>{formatNumber(getValue<number>() / STUDY_UNIT_VALUES[resultsUnit])}</p>
        ),
      },
    ]
  }, [resultsUnit, t, tQuality]) as ColumnDef<ResultsByTag>[]

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
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
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TagsResultsTable
