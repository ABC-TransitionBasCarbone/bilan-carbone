'use client'

import BaseTable from '@/components/base/Table'
import { TableActionButton } from '@/components/base/TableActionButton'
import { useServerFunction } from '@/hooks/useServerFunction'
import { toggleActionEnabled } from '@/services/serverFunctions/transitionPlan'
import { Switch } from '@mui/material'
import { Action, ActionPotentialDeduction, StudyResultUnit } from '@prisma/client'
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface Props {
  actions: Action[]
  openEditModal: (action: Action) => void
  openDeleteModal: (action: Action) => void
}

const ActionTable = ({ actions, openEditModal, openDeleteModal }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.table')
  const tUnit = useTranslations('study.results.units')
  const tCategory = useTranslations('study.transitionPlan.actions.category')
  const tPotential = useTranslations('study.transitionPlan.actions.potentialDeduction')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const router = useRouter()
  const { callServerFunction } = useServerFunction()

  const [localActions, setLocalActions] = useState<Action[]>(actions)

  useEffect(() => {
    setLocalActions(actions)
  }, [actions])

  const handleToggleEnabled = useCallback(
    async (actionId: string, enabled: boolean) => {
      setLocalActions((prev) => prev.map((action) => (action.id === actionId ? { ...action, enabled } : action)))

      await callServerFunction(() => toggleActionEnabled(actionId, enabled), {
        onSuccess: () => {
          router.refresh()
        },
        onError: () => {
          setLocalActions(actions)
        },
      })
    },
    [callServerFunction, router, setLocalActions, actions],
  )

  const getPotential = useCallback(
    (action: Action) => {
      switch (action.potentialDeduction) {
        case ActionPotentialDeduction.Quality:
          return tPotential(ActionPotentialDeduction.Quality)
        case ActionPotentialDeduction.Quantity:
          return action.reductionValue ? `${action.reductionValue} ${tUnit(StudyResultUnit.T)}` : ''
        default:
          return ''
      }
    },
    [tPotential, tUnit],
  )

  const columns = useMemo(
    () =>
      [
        {
          header: t('enabled'),
          accessorKey: 'enabled',
          cell: ({ getValue, row }) => (
            <Switch
              checked={getValue<boolean>()}
              onChange={(event) => handleToggleEnabled(row.original.id, event.target.checked)}
              color="primary"
              size="small"
            />
          ),
        },
        {
          header: t('title'),
          accessorKey: 'title',
        },
        {
          header: t('priority'),
          accessorKey: 'priority',
        },
        {
          header: t('actionType'),
          accessorFn: (action) => action.category.map((category) => tCategory(category)).join(', '),
        },
        {
          header: t('targetYear'),
          accessorFn: () => '',
        },
        { header: t('potential'), accessorFn: getPotential },
        { header: t('owner'), accessorKey: 'owner' },
        { header: `${t('budget')} (k€)`, accessorKey: 'necessaryBudget' },
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
      ] as ColumnDef<Action>[],
    [t, getPotential, handleToggleEnabled, tCategory, openEditModal, openDeleteModal],
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

export default ActionTable
