'use client'

import { TableActionButton } from '@/components/base/TableActionButton'
import { EngagementActionSteps, EngagementActionTargets } from '@/constants/engagementActions'
import type { FullStudy } from '@/db/study'
import { EngagementActionWithSites } from '@/services/serverFunctions/study'
import BaseTable from '@abc-transitionbascarbone/components/src/base/Table'
import { EngagementPhase } from '@abc-transitionbascarbone/db-common/enums'
import { formatDateFr } from '@abc-transitionbascarbone/utils'
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
  studySites: FullStudy['sites']
  openEditModal: (action: EngagementActionWithSites) => void
  openDeleteModal: (action: EngagementActionWithSites) => void
}

const EngagementActionTable = ({ actions, studySites, openEditModal, openDeleteModal }: Props) => {
  const t = useTranslations('study.engagementActions.table')
  const tCommon = useTranslations('study.organization')
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
          accessorKey: 'targets',
          accessorFn: (row) =>
            row.targets
              ?.map((target) =>
                Object.values(EngagementActionTargets).includes(target as EngagementActionTargets)
                  ? tTargets(target)
                  : target,
              )
              .join(', '),
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
          cell: ({ row }) => {
            const actionSites = row.original.sites || []
            const allSitesCount = studySites.length
            const isAllSites = actionSites.length === allSitesCount

            return isAllSites ? tCommon('allSites') : actionSites.map((site) => site.site.name).join(', ')
          },
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
    [t, tCommon, tSteps, tTargets, tPhases, studySites, openEditModal, openDeleteModal],
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
