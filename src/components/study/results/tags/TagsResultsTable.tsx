import { ResultsByTag } from '@/services/results/consolidated'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { StudyResultUnit } from '@prisma/client'
import { ColumnDef, flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import commonStyles from '../commonTable.module.css'

type tableDataType = {
  label: string
  value: number
  uncertainty: number
  children: tableDataType[]
}
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
        cell: ({ getValue, row }) => {
          return row.getCanExpand() ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className={classNames('align-center', commonStyles.expandable)}
            >
              {row.getIsExpanded() ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
              {getValue<string>()}
            </button>
          ) : (
            <p className={classNames('align-center', commonStyles.notExpandable, { pl1: row.depth > 0 })}>
              {getValue<string>()}
            </p>
          )
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
  }, [resultsUnit, t, tQuality]) as ColumnDef<tableDataType>[]

  const tableData = useMemo(
    () =>
      data.map((d) => ({
        label: d.label,
        value: d.value,
        uncertainty: d.uncertainty,
        children: d.children.map((child) => ({
          label: child.label,
          value: child.value,
          uncertainty: child.uncertainty,
          children: [],
        })),
      })),
    [data],
  )

  const table = useReactTable({
    columns,
    data: tableData,
    getSubRows: (row) => row.children,
    getExpandedRowModel: getExpandedRowModel(),
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
