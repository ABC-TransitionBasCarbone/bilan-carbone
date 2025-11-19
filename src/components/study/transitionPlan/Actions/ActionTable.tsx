'use client'

import BaseTable from '@/components/base/Table'
import { TableActionButton } from '@/components/base/TableActionButton'
import { useServerFunction } from '@/hooks/useServerFunction'
import { toggleActionEnabled } from '@/services/serverFunctions/transitionPlan'
import { getYearFromDateStr } from '@/utils/time'
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
  canEdit: boolean
}

const ActionTable = ({ actions, openEditModal, openDeleteModal, canEdit }: Props) => {
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

  const getImplementationPeriod = useCallback((action: Action) => {
    if (!action.reductionStartYear || !action.reductionEndYear) {
      return ''
    }
    const startYear = getYearFromDateStr(action.reductionStartYear)
    const endYear = getYearFromDateStr(action.reductionEndYear)
    return `${startYear}-${endYear}`
  }, [])

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
              disabled={!canEdit}
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
          header: t('implementation'),
          accessorFn: getImplementationPeriod,
        },
        { header: t('potential'), accessorFn: getPotential },
        { header: t('owner'), accessorKey: 'owner' },
        { header: `${t('budget')} (k€)`, accessorKey: 'necessaryBudget' },
        {
          id: 'actions',
          header: '',
          accessorFn: () => '',
          cell: ({ row }) =>
            canEdit ? (
              <>
                <TableActionButton type="edit" onClick={() => openEditModal(row.original)} />
                <TableActionButton type="delete" onClick={() => openDeleteModal(row.original)} />
              </>
            ) : (
              <></>
            ),
        },
      ] as ColumnDef<Action>[],
    [t, getImplementationPeriod, getPotential, canEdit, handleToggleEnabled, tCategory, openEditModal, openDeleteModal],
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
