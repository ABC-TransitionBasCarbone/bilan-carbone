'use client'

import BaseTable from '@/components/base/Table'
import { TableActionButton } from '@/components/base/TableActionButton'
import { Typography } from '@mui/material'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import { getDisplayedRates } from './ObjectivesTable.helper'
import styles from './ObjectivesTable.module.css'

export type ObjectiveRow = {
  id: string
  period: string
  reductionRate: number
  correctedRate?: number
  sites: string
  posts: string
  tags: string
  onEdit?: () => void
  onDelete?: () => void
}

interface Props {
  rows: ObjectiveRow[]
  canEdit: boolean
  isDefaultSnbc: boolean
  title?: string
}

const ObjectivesInnerTable = ({ rows, canEdit, isDefaultSnbc, title }: Props) => {
  const t = useTranslations('study.transitionPlan.objectives')
  const tCommon = useTranslations('common')

  const columns = useMemo((): ColumnDef<ObjectiveRow>[] => {
    const cols: ColumnDef<ObjectiveRow>[] = [
      {
        header: t('table.period'),
        accessorKey: 'period',
      },
      { header: tCommon('sites'), accessorKey: 'sites' },
      { header: tCommon('posts'), accessorKey: 'posts' },
      { header: tCommon('tags'), accessorKey: 'tags' },
      {
        header: t('table.rates'),
        accessorKey: 'reductionRate',
        cell: ({ row }) => getDisplayedRates(row.original.reductionRate, row.original.correctedRate),
      },
    ]

    if (canEdit) {
      cols.push({
        id: 'actions',
        header: '',
        accessorFn: () => '',
        cell: ({ row }) => (
          <div className="flex">
            {row.original.onEdit && <TableActionButton type="edit" onClick={row.original.onEdit} />}
            {row.original.onDelete && <TableActionButton type="delete" onClick={row.original.onDelete} />}
          </div>
        ),
      })
    }

    return cols
  }, [t, tCommon, canEdit])

  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className={`flex flex-col gapped-2`}>
      {title && (
        <Typography variant="body1" color="text.secondary">
          {title}
        </Typography>
      )}

      <BaseTable
        table={table}
        testId="trajectory-objectives-inner"
        size="small"
        className={classNames(isDefaultSnbc ? styles.defaultSnbcTable : undefined, styles.innerBaseTable)}
      />
    </div>
  )
}

export default ObjectivesInnerTable
