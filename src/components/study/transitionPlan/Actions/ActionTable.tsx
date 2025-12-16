'use client'

import BaseTable from '@/components/base/Table'
import { TableActionButton } from '@/components/base/TableActionButton'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { ActionWithRelations } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import { toggleActionEnabled } from '@/services/serverFunctions/transitionPlan'
import { formatNumber } from '@/utils/number'
import { convertValue } from '@/utils/study'
import { getYearFromDateStr } from '@/utils/time'
import { Link, Switch } from '@mui/material'
import { ActionPotentialDeduction, StudyResultUnit } from '@prisma/client'
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
  actions: ActionWithRelations[]
  openEditModal: (action: ActionWithRelations) => void
  openDeleteModal: (action: ActionWithRelations) => void
  canEdit: boolean
  studyId: string
  studyUnit: StudyResultUnit
}

const ActionTable = ({ actions, openEditModal, openDeleteModal, canEdit, studyId, studyUnit }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.table')
  const tUnit = useTranslations('study.results.units')
  const tCategory = useTranslations('study.transitionPlan.actions.category')
  const tPotential = useTranslations('study.transitionPlan.actions.potentialDeduction')
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })
  const router = useRouter()
  const { callServerFunction } = useServerFunction()

  const [localActions, setLocalActions] = useState<ActionWithRelations[]>(actions)

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
    (action: ActionWithRelations) => {
      switch (action.potentialDeduction) {
        case ActionPotentialDeduction.Quality:
          return tPotential(ActionPotentialDeduction.Quality)
        case ActionPotentialDeduction.Quantity:
          if (action.reductionValueKg !== null) {
            const valueInStudyUnit = convertValue(action.reductionValueKg, StudyResultUnit.K, studyUnit)
            return `${formatNumber(valueInStudyUnit)} ${tUnit(studyUnit)}`
          }
          return ''
        default:
          return ''
      }
    },
    [tPotential, tUnit, studyUnit],
  )

  const getImplementationPeriod = useCallback((action: ActionWithRelations) => {
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
          id: 'enabled',
          header: () => (
            <div className="flex-cc">
              <GlossaryIconModal
                title="enabledGlossaryTitle"
                iconLabel="enabledGlossaryIconLabel"
                label="enabled"
                tModal="study.transitionPlan.actions.table"
              >
                <p>
                  {t.rich('enabledGlossaryDescription', {
                    trajectoryLink: (children) => (
                      <Link href={`/etudes/${studyId}/trajectoires`} target="_blank" rel="noreferrer noopener">
                        {children}
                      </Link>
                    ),
                  })}
                </p>
              </GlossaryIconModal>
            </div>
          ),
          accessorKey: 'enabled',
          cell: ({ getValue, row }) => (
            <div className="flex-cc">
              <Switch
                checked={getValue<boolean>()}
                onChange={(event) => handleToggleEnabled(row.original.id, event.target.checked)}
                color="primary"
                size="small"
                disabled={!canEdit}
              />
            </div>
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
      ] as ColumnDef<ActionWithRelations>[],
    [
      t,
      getImplementationPeriod,
      getPotential,
      studyId,
      canEdit,
      handleToggleEnabled,
      tCategory,
      openEditModal,
      openDeleteModal,
    ],
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
