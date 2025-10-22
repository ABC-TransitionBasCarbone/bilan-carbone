'use client'

import BaseTable from '@/components/base/Table'
import OpenIcon from '@mui/icons-material/OpenInNew'
import { Action, ActionPotentialDeduction, StudyResultUnit } from '@prisma/client'
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import { useCallback, useMemo, useState } from 'react'
import ActionModal from './ActionModal'

interface Props {
  actions: Action[]
  studyUnit: string
  porters: { label: string; value: string }[]
  transitionPlanId: string
}

const Table = ({ actions, studyUnit, porters, transitionPlanId }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.table')
  const tUnit = useTranslations('study.results.units')
  const tCategory = useTranslations('study.transitionPlan.actions.category')
  const tPotential = useTranslations('study.transitionPlan.actions.potentialDeduction')
  const [editing, setEditing] = useState<Action | undefined>(undefined)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 })

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
          header: t('title'),
          accessorKey: 'title',
          cell: ({ getValue, row }) => (
            <div className="justify-around align-center">
              <span>{getValue<string>()}</span>
              <OpenIcon className="pointer" onClick={() => setEditing(row.original)} />
            </div>
          ),
        },
        {
          header: t('actionType'),
          accessorFn: (action) => action.category.map((category) => tCategory(category)).join(', '),
        },
        {
          header: t('targetYear'),
          // accessorFn: (action) => Number(dayjs(action.reductionStartYear).year()),
          accessorFn: () => '',
        },
        { header: t('potential'), accessorFn: getPotential },
        { header: t('porter'), accessorKey: 'actionPorter' },
        { header: `${t('budget')} (k€)`, accessorKey: 'necessaryBudget' },
      ] as ColumnDef<Action>[],
    [getPotential, t, tCategory],
  )

  const table = useReactTable({
    columns,
    data: actions,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { pagination },
  })

  return (
    <>
      <BaseTable table={table} paginations={[10, 25, 50, 100]} className="mt1" testId="actions" />
      {!!editing && (
        <ActionModal
          open
          onClose={() => setEditing(undefined)}
          action={editing}
          transitionPlanId={transitionPlanId}
          studyUnit={studyUnit}
          porters={porters}
        />
      )}
    </>
  )
}

export default Table
