'use client'

import BaseTable from '@/components/base/Table'
import { TableActionButton } from '@/components/base/TableActionButton'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import { customRich } from '@/i18n/customRich'
import { deleteObjective, deleteTrajectory } from '@/services/serverFunctions/trajectory'
import { formatNumber } from '@/utils/number'
import { getTrajectoryTypeLabel } from '@/utils/trajectory'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Chip } from '@mui/material'
import { TrajectoryType } from '@prisma/client'
import { ColumnDef, getCoreRowModel, getExpandedRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import styles from './TrajectoryObjectivesTable.module.css'

const ConfirmDeleteModal = dynamic(() => import('../../modals/ConfirmDeleteModal'), { ssr: false })
const TrajectoryCreationModal = dynamic(() => import('./TrajectoryCreationModal'), { ssr: false })

type TrajectoryRow = {
  id: string
  name: string
  type: TrajectoryType
  targetYear?: number
  reductionRate?: number
  isTrajectory: true
  trajectory: TrajectoryWithObjectives
  children: ObjectiveRow[]
}

type ObjectiveRow = {
  id: string
  name: string
  targetYear: number
  reductionRate: number
  isTrajectory: false
  trajectoryId: string
  children?: never
}

type TableDataType = TrajectoryRow | ObjectiveRow

interface Props {
  trajectories: TrajectoryWithObjectives[]
  canEdit: boolean
  transitionPlanId: string
  studyId: string
  searchFilter?: string
}

const fuseOptions = {
  keys: [{ name: 'name', weight: 1 }],
  threshold: 0.3,
  isCaseSensitive: false,
}

const TrajectoryObjectivesTable = ({ trajectories, canEdit, transitionPlanId, studyId, searchFilter = '' }: Props) => {
  const tAction = useTranslations('common.action')
  const t = useTranslations('study.transitionPlan.objectives')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'trajectory' | 'objective'
    id: string
    name: string
  } | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTrajectory, setEditTrajectory] = useState<TrajectoryWithObjectives | null>(null)

  const fuse = useMemo(() => new Fuse(trajectories, fuseOptions), [trajectories])

  const handleDeleteClick = (type: 'trajectory' | 'objective', id: string, name: string) => {
    setDeleteTarget({ type, id, name })
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    const result =
      deleteTarget.type === 'trajectory'
        ? await callServerFunction(() => deleteTrajectory(deleteTarget.id))
        : await callServerFunction(() => deleteObjective(deleteTarget.id))

    if (result.success) {
      if (deleteTarget.type === 'trajectory') {
        const stored = localStorage.getItem(`trajectory-custom-selected-${studyId}`)
        if (stored) {
          const selectedIds = JSON.parse(stored) as string[]
          const updatedIds = selectedIds.filter((id) => id !== deleteTarget.id)
          localStorage.setItem(`trajectory-custom-selected-${studyId}`, JSON.stringify(updatedIds))
        }
      }
      setDeleteModalOpen(false)
      setDeleteTarget(null)
      router.refresh()
    }
  }

  const handleEditClick = (trajectory: TrajectoryWithObjectives) => {
    setEditTrajectory(trajectory)
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    router.refresh()
    setEditModalOpen(false)
    setEditTrajectory(null)
  }

  const columns = useMemo(() => {
    return [
      {
        id: 'expand',
        header: '',
        accessorFn: () => '',
        cell: ({ row }) => {
          const isTrajectory = row.original.isTrajectory
          const hasChildren = row.getCanExpand()
          const isExpanded = row.getIsExpanded()

          if (isTrajectory && hasChildren) {
            return (
              <div onClick={row.getToggleExpandedHandler()} className={classNames('align-center', styles.expandable)}>
                {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
              </div>
            )
          }

          return null
        },
      },
      {
        header: t('table.name'),
        accessorFn: (row) => row.name,
        cell: ({ getValue, row }) => {
          const isTrajectory = row.original.isTrajectory

          if (isTrajectory) {
            return <span>{getValue<string>()}</span>
          }

          return null
        },
      },
      {
        header: t('table.type'),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const data = getValue<TableDataType>()

          if (!data.isTrajectory) {
            return <p className="pl1">{data.name}</p>
          }

          return <Chip label={getTrajectoryTypeLabel(data.type, t)} size="small" color="info" variant="outlined" />
        },
      },
      {
        header: t('table.targetYear'),
        accessorFn: ({ targetYear }) => targetYear,
        cell: ({ getValue, row }) => {
          const year = getValue<number | undefined>()
          const isExpanded = row.getIsExpanded()
          const isTrajectory = row.original.isTrajectory

          if (isTrajectory && isExpanded) {
            return null
          }

          return year ? year : null
        },
      },
      {
        header: t('table.reductionRate'),
        accessorFn: ({ reductionRate }) => reductionRate,
        cell: ({ getValue, row }) => {
          const rate = getValue<number | undefined>()
          const isExpanded = row.getIsExpanded()
          const isTrajectory = row.original.isTrajectory

          if (isTrajectory && isExpanded) {
            return null
          }

          return rate !== undefined ? `${formatNumber(rate * 100, 2)}%` : null
        },
      },
      {
        id: 'actions',
        header: '',
        accessorFn: () => '',
        cell: ({ row }) => {
          if (!canEdit) {
            return null
          }

          const rowData = row.original

          if (rowData.isTrajectory) {
            return (
              <div className="flex">
                <TableActionButton type="edit" onClick={() => handleEditClick(rowData.trajectory)} />
                <TableActionButton
                  type="delete"
                  onClick={() => handleDeleteClick('trajectory', rowData.id, rowData.name)}
                />
              </div>
            )
          }

          const parentTrajectory = trajectories.find((t) => t.id === rowData.trajectoryId)

          const canEditObjective = parentTrajectory && parentTrajectory.type === TrajectoryType.CUSTOM

          const canDeleteObjective =
            parentTrajectory &&
            parentTrajectory.type === TrajectoryType.CUSTOM &&
            parentTrajectory.objectives.length > 1

          return (
            <div className="flex">
              {canEditObjective && <TableActionButton type="edit" onClick={() => handleEditClick(parentTrajectory)} />}
              {canDeleteObjective && (
                <TableActionButton
                  type="delete"
                  onClick={() => handleDeleteClick('objective', rowData.id, rowData.name)}
                />
              )}
            </div>
          )
        },
      },
    ]
  }, [t, canEdit, trajectories]) as ColumnDef<TableDataType>[]

  const tableData = useMemo((): TrajectoryRow[] => {
    const filteredTrajectories = searchFilter ? fuse.search(searchFilter).map(({ item }) => item) : trajectories

    return filteredTrajectories.map((trajectory) => {
      const sortedObjectives = [...trajectory.objectives].sort((a, b) => a.targetYear - b.targetYear)
      const lastObjective = sortedObjectives[sortedObjectives.length - 1]

      return {
        id: trajectory.id,
        name: trajectory.name,
        type: trajectory.type,
        targetYear: lastObjective?.targetYear,
        reductionRate: lastObjective?.reductionRate,
        isTrajectory: true as const,
        trajectory,
        children: sortedObjectives.map((objective, index) => ({
          id: objective.id,
          name: t('objectiveNumber', { number: index + 1 }),
          targetYear: objective.targetYear,
          reductionRate: objective.reductionRate,
          isTrajectory: false as const,
          trajectoryId: trajectory.id,
        })),
      }
    })
  }, [trajectories, t, searchFilter, fuse])

  const table = useReactTable({
    columns,
    data: tableData,
    getSubRows: (row) => {
      if (row.isTrajectory) {
        return row.children
      }
      return undefined
    },
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      <BaseTable table={table} testId="trajectory-objectives" />
      {deleteModalOpen && (
        <ConfirmDeleteModal
          open={deleteModalOpen}
          title={deleteTarget?.type === 'trajectory' ? t('deleteTrajectory.title') : t('deleteObjective.title')}
          message={
            deleteTarget?.type === 'trajectory'
              ? customRich(t, 'deleteTrajectory.message')
              : customRich(t, 'deleteObjective.message')
          }
          confirmText={tAction('delete')}
          cancelText={tAction('cancel')}
          requireNameMatch={deleteTarget?.type === 'trajectory' ? deleteTarget.name : undefined}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false)
            setDeleteTarget(null)
          }}
        />
      )}
      {editModalOpen && (
        <TrajectoryCreationModal
          open={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setEditTrajectory(null)
          }}
          transitionPlanId={transitionPlanId}
          onSuccess={handleEditSuccess}
          trajectory={editTrajectory}
        />
      )}
    </>
  )
}

export default TrajectoryObjectivesTable
