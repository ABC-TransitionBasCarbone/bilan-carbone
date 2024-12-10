'use client'

import { FullStudy } from '@/db/study'
import { computeResultsByPost, ResultsByPost } from '@/services/results/consolidated'
import { getStandardDeviationRating } from '@/services/uncertainty'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { ColumnDef, flexRender, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './ConsolidatedResultsTable.module.css'

interface Props {
  study: FullStudy
  site: string
}

const ConsolidatedResultsTable = ({ study, site }: Props) => {
  const t = useTranslations('study.results')
  const tQuality = useTranslations('quality')
  const tPost = useTranslations('emissionFactors.post')

  const columns = useMemo(
    () =>
      [
        {
          header: t('post'),
          accessorFn: ({ post }) => tPost(post),
          cell: ({ row, getValue }) => {
            return row.getCanExpand() ? (
              <button
                onClick={row.getToggleExpandedHandler()}
                className={classNames('align-center', styles.expandable)}
              >
                {row.getIsExpanded() ? (
                  <KeyboardArrowDownIcon className={styles.svg} />
                ) : (
                  <KeyboardArrowRightIcon className={styles.svg} />
                )}
                {getValue<string>()}
              </button>
            ) : (
              <p className={classNames('align-center', styles.notExpandable, { [styles.subPost]: row.depth > 0 })}>
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
          header: t('value'),
          accessorKey: 'value',
          cell: ({ getValue }) => <p className={styles.number}>{getValue<number>().toFixed(2)}</p>,
        },
      ] as ColumnDef<ResultsByPost>[],
    [t, tPost, tQuality],
  )

  const data = useMemo(() => computeResultsByPost(study, tPost, site), [study, tPost, site])

  const table = useReactTable({
    columns,
    data,
    getSubRows: (row) => row.subPosts,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <table aria-labelledby="study-rights-table-title">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id}>
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
    </>
  )
}

export default ConsolidatedResultsTable
