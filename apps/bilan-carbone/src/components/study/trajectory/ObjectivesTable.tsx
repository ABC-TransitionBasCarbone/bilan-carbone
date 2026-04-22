'use client'

import BaseTable from '@/components/base/Table'
import baseTableStyles from '@/components/base/Table.module.css'
import { TableActionButton } from '@/components/base/TableActionButton'
import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import { useServerFunction } from '@/hooks/useServerFunction'
import { customRich } from '@/i18n/customRich'
import { deleteObjective } from '@/services/serverFunctions/objective.serverFunction'
import { deleteTrajectory } from '@/services/serverFunctions/trajectory.serverFunction'
import type { ObjectiveWithScope, PastStudy, TrajectoryWithObjectivesAndScope } from '@/types/trajectory.types'
import { getCustomData } from '@/utils/customTrajectory.utils'
import {
  calculateTrajectoryYearBounds,
  getDisplayedReferenceYearForTrajectoryType,
  getTrajectoryTypeLabel,
} from '@/utils/trajectory'
import { getAverageAnnualRateFromTrajectory, getLatestPastStudy } from '@/utils/trajectory-shared.utils'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Chip, IconButton, TableCell, TableRow, Tooltip } from '@mui/material'
import { SectenInfo } from '@repo/db-common'
import { TrajectoryType } from '@repo/db-common/enums'
import { ColumnDef, flexRender, getCoreRowModel, getExpandedRowModel, Row, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import Fuse from 'fuse.js'
import { useLocale, useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useMemo, useState } from 'react'
import ObjectivesSubTable from './ObjectivesExpandedRow'
import { getDisplayedRates } from './ObjectivesTable.helper'
import styles from './ObjectivesTable.module.css'

const ConfirmDeleteModal = dynamic(() => import('../../modals/ConfirmDeleteModal'), { ssr: false })
const TrajectoryCreationModal = dynamic(() => import('./TrajectoryCreationModal'), { ssr: false })
const ObjectiveModal = dynamic(() => import('./ObjectiveModal'), { ssr: false })
const TrajectoryConversionWarningModal = dynamic(() => import('./TrajectoryConversionWarningModal'), { ssr: false })

type TrajectoryRow = {
  id: string
  name: string
  type: TrajectoryType
  targetYear?: number
  reductionRate?: number
  referenceYear?: number
  correctedRate?: number
  trajectory: TrajectoryWithObjectivesAndScope
}

type TrajectoryDisplayData = {
  previousTrajectory: Array<{ year: number; value: number }> | null
  currentTrajectory: Array<{ year: number; value: number }>
  withinThreshold: boolean
}

interface Props {
  trajectories: TrajectoryWithObjectivesAndScope[]
  canEdit: boolean
  transitionPlanId: string
  studyId: string
  studyYear: number
  searchFilter?: string
  sectenData: SectenInfo[]
  studyEmissions?: number
  pastStudies?: PastStudy[]
  sites?: Array<{ id: string; name: string }>
  tagFamilies?: Array<{
    id: string
    name: string
    studyId: string
    tags: Array<{ id: string; name: string; color: string | null }>
  }>
  defaultSnbcSectoralTrajectoryId?: string | null
}

const fuseOptions = {
  keys: [{ name: 'name', weight: 1 }],
  threshold: 0.3,
  isCaseSensitive: false,
}

const ObjectivesTable = ({
  trajectories,
  canEdit,
  transitionPlanId,
  studyId,
  studyYear,
  searchFilter = '',
  sectenData,
  studyEmissions = 0,
  pastStudies = [],
  sites = [],
  tagFamilies = [],
  defaultSnbcSectoralTrajectoryId,
}: Props) => {
  const locale = useLocale()
  const tAction = useTranslations('common.action')
  const tDocumentation = useTranslations('documentationUrl')
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
  const [editTrajectory, setEditTrajectory] = useState<TrajectoryWithObjectivesAndScope | null>(null)
  const [objectiveModalOpen, setObjectiveModalOpen] = useState(false)
  const [objectiveModalTrajectory, setObjectiveModalTrajectory] = useState<TrajectoryWithObjectivesAndScope | null>(
    null,
  )
  const [editObjective, setEditObjective] = useState<ObjectiveWithScope | null>(null)
  const [conversionWarningOpen, setConversionWarningOpen] = useState(false)
  const [pendingTrajectory, setPendingTrajectory] = useState<TrajectoryWithObjectivesAndScope | null>(null)

  const fuse = useMemo(() => new Fuse(trajectories, fuseOptions), [trajectories])

  const trajectoryDataMap = useMemo(() => {
    const map = new Map<string, TrajectoryDisplayData>()

    if (trajectories.length === 0) {
      return map
    }

    const selectedCustomTrajectoryIds = trajectories.map((trajectory) => trajectory.id)
    const { minYear, maxYear } = calculateTrajectoryYearBounds(
      false,
      pastStudies,
      trajectories,
      selectedCustomTrajectoryIds,
      [],
    )
    const { customTrajectoriesData } = getCustomData(
      trajectories,
      selectedCustomTrajectoryIds,
      studyEmissions,
      studyYear,
      pastStudies,
      getLatestPastStudy(pastStudies),
      minYear,
      maxYear,
      sectenData,
    )

    customTrajectoriesData.forEach((trajectoryData) => {
      map.set(trajectoryData.id, {
        previousTrajectory: trajectoryData.data.previousTrajectory,
        currentTrajectory: trajectoryData.data.currentTrajectory,
        withinThreshold: trajectoryData.data.withinThreshold,
      })
    })

    return map
  }, [trajectories, pastStudies, studyEmissions, studyYear, sectenData])

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

  const handleEditClick = (trajectory: TrajectoryWithObjectivesAndScope) => {
    setEditTrajectory(trajectory)
    setEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    router.refresh()
    setEditModalOpen(false)
    setEditTrajectory(null)
  }

  const handleAddObjectiveClick = (trajectory: TrajectoryWithObjectivesAndScope) => {
    const isSBTI = trajectory.type === TrajectoryType.SBTI_15 || trajectory.type === TrajectoryType.SBTI_WB2C
    const isSNBC = trajectory.type === TrajectoryType.SNBC_GENERAL || trajectory.type === TrajectoryType.SNBC_SECTORAL

    if (isSBTI || isSNBC) {
      setPendingTrajectory(trajectory)
      setConversionWarningOpen(true)
    } else {
      setObjectiveModalTrajectory(trajectory)
      setObjectiveModalOpen(true)
    }
  }

  const handleConversionConfirm = () => {
    if (pendingTrajectory) {
      setObjectiveModalTrajectory(pendingTrajectory)
      setObjectiveModalOpen(true)
    }
    setConversionWarningOpen(false)
    setPendingTrajectory(null)
  }

  const handleConversionCancel = () => {
    setConversionWarningOpen(false)
    setPendingTrajectory(null)
  }

  const handleObjectiveSuccess = () => {
    router.refresh()
    setObjectiveModalOpen(false)
    setObjectiveModalTrajectory(null)
    setEditObjective(null)
  }

  const handleEditObjectiveClick = (objective: ObjectiveWithScope, trajectory: TrajectoryWithObjectivesAndScope) => {
    setEditObjective(objective)
    setObjectiveModalTrajectory(trajectory)
    setObjectiveModalOpen(true)
  }

  const columns = useMemo(() => {
    return [
      {
        id: 'expand',
        header: '',
        accessorFn: () => '',
        cell: ({ row }) => {
          const isExpanded = row.getIsExpanded()
          const rowData = row.original as TrajectoryRow
          const hasObjectives = rowData.trajectory.objectives.length > 0

          if (!hasObjectives && !canEdit) {
            return null
          }

          return (
            <div onClick={row.getToggleExpandedHandler()} className={classNames('align-center', styles.expandable)}>
              {isExpanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
            </div>
          )
        },
      },
      {
        header: t('table.name'),
        accessorFn: (row) => row.name,
        cell: ({ getValue }) => <span>{getValue<string>()}</span>,
      },
      {
        header: t('table.type'),
        accessorFn: (row) => row,
        cell: ({ getValue }) => {
          const data = getValue<TrajectoryRow>()
          const label =
            data.id === defaultSnbcSectoralTrajectoryId
              ? t('defaultSnbcSectoral')
              : getTrajectoryTypeLabel(data.type, t)

          return <Chip label={label} size="small" color="info" variant="outlined" />
        },
      },
      {
        header: t('table.referenceYear'),
        accessorFn: (row) => row.referenceYear,
        cell: ({ getValue }) => {
          const refYear = getValue<number | undefined>()
          return refYear || null
        },
      },
      {
        header: t('table.targetYear'),
        accessorFn: ({ targetYear }) => targetYear,
        cell: ({ getValue }) => {
          const year = getValue<number | undefined>()
          return year ? year : null
        },
      },
      {
        id: 'rates',
        header: () => (
          <div className="flex align-center gapped025">
            {t('table.rates')}
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
                ,
              </p>
            </GlossaryIconModal>
          </div>
        ),
        accessorFn: (row) => row,
        cell: ({ row }) => {
          return getDisplayedRates(locale, row.original.reductionRate, row.original.correctedRate)
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

          const rowData = row.original as TrajectoryRow

          if (rowData.id === defaultSnbcSectoralTrajectoryId) {
            return (
              <Tooltip title={t('defaultSnbcTooltip')}>
                <IconButton size="medium" color="primary">
                  <HelpOutlineIcon fontSize="medium" color="disabled" />
                </IconButton>
              </Tooltip>
            )
          }

          return (
            <div className="flex">
              <TableActionButton type="edit" onClick={() => handleEditClick(rowData.trajectory)} />
              <TableActionButton
                type="delete"
                onClick={() => handleDeleteClick('trajectory', rowData.id, rowData.name)}
              />
            </div>
          )
        },
      },
    ]
  }, [t, defaultSnbcSectoralTrajectoryId, canEdit]) as ColumnDef<TrajectoryRow>[]

  const tableData = useMemo((): TrajectoryRow[] => {
    const filteredTrajectories = searchFilter ? fuse.search(searchFilter).map(({ item }) => item) : trajectories

    return filteredTrajectories.map((trajectory) => {
      const sortedObjectives = [...trajectory.objectives].sort((a, b) => a.targetYear - b.targetYear)
      const lastObjective = sortedObjectives[sortedObjectives.length - 1]
      const refYear = trajectory.referenceYear || getDisplayedReferenceYearForTrajectoryType(trajectory.type, studyYear)
      const trajectoryData = trajectoryDataMap.get(trajectory.id)
      const withinThreshold = trajectoryData?.withinThreshold ?? true
      const rateStartYear = withinThreshold ? refYear : studyYear
      const referenceTrajectory = trajectoryData?.previousTrajectory ?? trajectoryData?.currentTrajectory
      const endYear = lastObjective?.targetYear
      const referenceRate =
        endYear !== undefined
          ? getAverageAnnualRateFromTrajectory(referenceTrajectory, rateStartYear, endYear)
          : undefined
      const compensatedRate = withinThreshold
        ? undefined
        : endYear !== undefined
          ? getAverageAnnualRateFromTrajectory(trajectoryData?.currentTrajectory, studyYear, endYear)
          : undefined

      return {
        id: trajectory.id,
        name: trajectory.name,
        type: trajectory.type,
        targetYear: lastObjective?.targetYear,
        reductionRate: referenceRate,
        referenceYear: refYear,
        correctedRate: compensatedRate,
        trajectory,
      }
    })
  }, [trajectories, searchFilter, fuse, studyYear, trajectoryDataMap])

  const table = useReactTable({
    columns,
    data: tableData,
    getExpandedRowModel: getExpandedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getRowCanExpand: (row) => canEdit || row.original.trajectory.objectives.length > 0,
  })

  const renderRow = (row: Row<TrajectoryRow>) => {
    const rowData = row.original
    const isDefaultSnbc = rowData.id === defaultSnbcSectoralTrajectoryId
    const isExpanded = row.getIsExpanded()
    const colCount = row.getVisibleCells().length
    const refYear = rowData.referenceYear ?? studyYear

    return (
      <Fragment key={row.id}>
        <TableRow
          key={row.id}
          className={classNames(baseTableStyles.line, {
            [styles.defaultSnbcRow]: isDefaultSnbc,
            [styles.expandedParentRow]: isExpanded,
          })}
          data-testid="trajectory-table-row"
        >
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
          ))}
        </TableRow>
        {isExpanded && (
          <TableRow key={`${row.id}-subtable`} className={styles.expandedRow}>
            <TableCell colSpan={colCount} className={styles.expandedRowCell}>
              <ObjectivesSubTable
                trajectory={rowData.trajectory}
                canEdit={canEdit && !isDefaultSnbc}
                isDefaultSnbc={isDefaultSnbc}
                trajectoryData={trajectoryDataMap.get(rowData.id)}
                defaultObjectiveReferenceYear={refYear}
                studyYear={studyYear}
                sites={sites}
                onAddObjective={() => handleAddObjectiveClick(rowData.trajectory)}
                onEditObjective={(objective) => handleEditObjectiveClick(objective, rowData.trajectory)}
                onDeleteObjective={(id, name) => handleDeleteClick('objective', id, name)}
                onEditTrajectory={() => handleEditClick(rowData.trajectory)}
              />
            </TableCell>
          </TableRow>
        )}
      </Fragment>
    )
  }

  return (
    <>
      <BaseTable table={table} testId="trajectory-objectives" customRow={renderRow} />
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
          studyYear={studyYear}
          sectenData={sectenData}
          studyEmissions={studyEmissions}
          pastStudies={pastStudies}
        />
      )}
      {objectiveModalOpen && objectiveModalTrajectory && (
        <ObjectiveModal
          open={objectiveModalOpen}
          onClose={() => {
            setObjectiveModalOpen(false)
            setObjectiveModalTrajectory(null)
            setEditObjective(null)
          }}
          trajectory={objectiveModalTrajectory}
          studyYear={studyYear}
          onSuccess={handleObjectiveSuccess}
          objective={editObjective || undefined}
          sites={sites}
          tagFamilies={tagFamilies}
        />
      )}
      {conversionWarningOpen && pendingTrajectory && (
        <TrajectoryConversionWarningModal
          open={conversionWarningOpen}
          onConfirm={handleConversionConfirm}
          onCancel={handleConversionCancel}
          trajectoryName={pendingTrajectory.name}
          trajectoryType={pendingTrajectory.type}
        />
      )}
    </>
  )
}

export default ObjectivesTable
