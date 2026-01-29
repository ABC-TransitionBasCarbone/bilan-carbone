'use client'

import BaseTable from '@/components/base/Table'
import styles from '@/components/base/Table.module.css'
import { TableActionButton } from '@/components/base/TableActionButton'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import commonStyles from '@/components/study/results/commonTable.module.css'
import { ActionWithRelations } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import { toggleActionEnabled } from '@/services/serverFunctions/transitionPlan'
import { formatNumber } from '@/utils/number'
import { convertValue } from '@/utils/study'
import { getYearFromDateStr } from '@/utils/time'
import ArrowRight from '@mui/icons-material/ArrowRight'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Link, Switch, TableCell, TableRow } from '@mui/material'
import { ActionPotentialDeduction, StudyResultUnit } from '@prisma/client'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  PaginationState,
  Row,
  useReactTable,
} from '@tanstack/react-table'
import classNames from 'classnames'
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
  const tAction = useTranslations('study.transitionPlan.actions')
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
          id: 'expand',
          header: '',
          accessorFn: () => '',
          cell: ({ row }) => (
            <button
              onClick={row.getToggleExpandedHandler()}
              className={classNames('align-center', commonStyles.expandable)}
            >
              {row.getIsExpanded() ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
            </button>
          ),
        },
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
    getRowCanExpand: () => true,
    getExpandedRowModel: getExpandedRowModel(),
    state: { pagination },
  })

  const Row = (row: Row<ActionWithRelations>) => (
    <>
      <TableRow key={row.id} className={styles.line} data-testid="actions-table-row">
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
        ))}
      </TableRow>

      {row.getIsExpanded() && (
        <TableRow>
          <TableCell colSpan={row.getVisibleCells().length}>
            <p className="italic mb1">{row.original.detailedDescription}</p>
            <p className="bold">{tAction('addModal.subSteps')} :</p>
            <p className="mb1 flex">
              {row.original.steps.map((step, index) => (
                <div key={step.id} className="flex align-center">
                  <span>{step.title}</span>
                  {index < row.original.steps.length - 1 && <ArrowRight />}
                </div>
              ))}
            </p>
            {!!row.original.nature.length && (
              <p className="mb1">
                <span className="bold">{tAction('addModal.nature')} : </span>
                {row.original.nature.map((n) => tAction(`nature.${n}`)).join(', ')}
              </p>
            )}
            {!!row.original.category.length && (
              <p className="mb1">
                <span className="bold">{tAction('addModal.category')} : </span>
                {row.original.category.map((c) => tAction(`category.${c}`)).join(', ')}
              </p>
            )}
            {!!row.original.relevance.length && (
              <p>
                <span className="bold">{t('relevance')} : </span>
                {row.original.relevance.map((r) => tAction(`relevance.${r}`)).join(', ')}
              </p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  )

  return <BaseTable customRow={Row} table={table} paginations={[10, 25, 50, 100]} testId="actions" />
}

export default ActionTable
