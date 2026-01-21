'use client'

import BaseTable from '@/components/base/Table'
import { TableActionButton } from '@/components/base/TableActionButton'
import { EngagementActionSteps, EngagementActionTargets } from '@/constants/engagementActions'
import { EngagementActionWithSites } from '@/services/serverFunctions/study'
import { formatDateFr } from '@/utils/time'
import { EngagementPhase } from '@prisma/client'
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'

interface Props {
  actions: EngagementActionWithSites[]
  openEditModal: (action: EngagementActionWithSites) => void
  openDeleteModal: (action: EngagementActionWithSites) => void
}

const EngagementActionTable = ({ actions, openEditModal, openDeleteModal }: Props) => {
  const t = useTranslations('study.engagementActions.table')
  const tTargets = useTranslations('study.engagementActions.targets')
  const tSteps = useTranslations('study.engagementActions.steps')
  const tPhases = useTranslations('study.engagementActions.phases')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

  const [localActions, setLocalActions] = useState<EngagementActionWithSites[]>(actions)

  useEffect(() => {
    setLocalActions(actions)
  }, [actions])

  const columns = useMemo(
    () =>
      [
        {
          header: t('name'),
          accessorKey: 'name',
        },
        {
          header: t('description'),
          accessorKey: 'description',
        },
        {
          header: t('steps'),
          accessorKey: 'steps',
          accessorFn: (row) =>
            Object.values(EngagementActionSteps).includes(row.steps as EngagementActionSteps)
              ? tSteps(row.steps)
              : row.steps,
        },
        {
          header: t('target'),
          accessorKey: 'target',
          accessorFn: (row) =>
            Object.values(EngagementActionTargets).includes(row.target as EngagementActionTargets)
              ? tTargets(row.target)
              : row.target,
        },
        {
          header: t('phase'),
          accessorKey: 'phase',
          accessorFn: (row) =>
            Object.values(EngagementPhase).includes(row.phase as EngagementPhase) ? tPhases(row.phase) : row.phase,
        },
        {
          header: t('date'),
          accessorFn: (row) => formatDateFr(row.date),
        },
        {
          header: t('sites'),
          accessorFn: (row) => row.sites?.map((site) => site.site.name).join(', '),
        },
        {
          id: 'actions',
          header: '',
          accessorFn: () => '',
          cell: ({ row }) => (
            <>
              <TableActionButton type="edit" onClick={() => openEditModal(row.original)} />
              <TableActionButton type="delete" onClick={() => openDeleteModal(row.original)} />
            </>
          ),
        },
      ] as ColumnDef<EngagementActionWithSites>[],
    [t, tTargets, tSteps, openEditModal, openDeleteModal],
  )

  const table = useReactTable({
    columns,
    data: localActions,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
  })

  return <BaseTable table={table} paginations={[10, 25, 50, 100]} testId="actions" />
}

export default EngagementActionTable
