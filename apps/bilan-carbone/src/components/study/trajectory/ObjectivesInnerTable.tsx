'use client'

import { TableActionButton } from '@/components/base/TableActionButton'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { customRich } from '@/i18n/customRich'
import BaseTable from '@abc-transitionbascarbone/components/src/base/Table'
import { Link, Typography } from '@mui/material'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useLocale, useTranslations } from 'next-intl'
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
  hasFilters?: boolean
  isCustom: boolean
}

const ObjectivesInnerTable = ({ rows, canEdit, isDefaultSnbc, title, hasFilters = false, isCustom }: Props) => {
  const t = useTranslations('study.transitionPlan.objectives')
  const tDocumentation = useTranslations('documentationUrl')
  const locale = useLocale()
  const tCommon = useTranslations('common')

  const columns = useMemo((): ColumnDef<ObjectiveRow>[] => {
    const cols: ColumnDef<ObjectiveRow>[] = [
      ...(isCustom
        ? [
            {
              header: t('table.name'),
              accessorKey: 'name',
            },
          ]
        : []),
      {
        header: t('table.period'),
        accessorKey: 'period',
      },
      { header: tCommon('sites'), accessorKey: 'sites' },
      { header: tCommon('posts'), accessorKey: 'posts' },
      { header: tCommon('tags'), accessorKey: 'tags' },
      {
        header: () => (
          <div className="flex align-center gapped025">
            {`${t('table.rates')}${hasFilters ? ` ${t('table.ratesWithFilters')}` : ''}`}
            <GlossaryIconModal
              title="table.ratesGlossary.title"
              label="reduction-rates"
              tModal="study.transitionPlan.objectives"
            >
              <p>
                {customRich(t, 'table.ratesGlossary.description', {
                  link: (children) => (
                    <Link href={tDocumentation('carbonBudget')} target="_blank" rel="noreferrer noopener">
                      {children}
                    </Link>
                  ),
                })}
              </p>
            </GlossaryIconModal>
          </div>
        ),
        accessorKey: 'reductionRate',
        cell: ({ row }) => getDisplayedRates(locale, row.original.reductionRate, row.original.correctedRate),
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
  }, [t, tCommon, canEdit, tDocumentation, locale, hasFilters])

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
