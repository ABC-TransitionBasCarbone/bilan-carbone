'use client'

import BaseTable from '@/components/base/Table'
import { TableActionButton } from '@/components/base/TableActionButton'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteExternalStudy, deleteLinkedStudy } from '@/services/serverFunctions/transitionPlan'
import { formatNumber } from '@/utils/number'
import { PastStudy } from '@/utils/trajectory'
import type { StudyResultUnit } from '@prisma/client'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

const ConfirmDeleteModal = dynamic(() => import('../../modals/ConfirmDeleteModal'))

interface Props {
  transitionPlanId: string
  pastStudies: PastStudy[]
  canEdit: boolean
  onEdit: (study: PastStudy) => void
  studyUnit: StudyResultUnit
}

const LinkedStudiesTable = ({ transitionPlanId, pastStudies, canEdit, onEdit, studyUnit }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.linkedStudies.table')
  const tDeleteModal = useTranslations('study.transitionPlan.trajectories.linkedStudies.deleteModal')
  const tUnit = useTranslations('study.results.units')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'linked' | 'external'
    id: string
    name: string
  } | null>(null)

  const handleDeleteClick = useCallback((type: 'linked' | 'external', id: string, name: string) => {
    setDeleteTarget({ type, id, name })
    setDeleteModalOpen(true)
  }, [])

  const handleDeleteSuccess = useCallback(() => {
    router.refresh()
    setDeleteModalOpen(false)
    setDeleteTarget(null)
  }, [router])

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return
    }

    if (deleteTarget.type === 'linked') {
      await callServerFunction(() => deleteLinkedStudy(deleteTarget.id, transitionPlanId), {
        onSuccess: handleDeleteSuccess,
      })
    } else {
      await callServerFunction(() => deleteExternalStudy(deleteTarget.id, transitionPlanId), {
        onSuccess: handleDeleteSuccess,
      })
    }
  }

  const mergedColumns = useMemo<ColumnDef<PastStudy>[]>(() => {
    const baseColumns: ColumnDef<PastStudy>[] = [
      {
        header: t('name'),
        accessorKey: 'name',
        cell: ({ row }) => {
          if (row.original.type === 'linked') {
            return (
              <Link href={`/etudes/${row.original.id}`} className="link">
                {row.original.name}
              </Link>
            )
          }
          return row.original.name
        },
      },
      { header: t('year'), accessorKey: 'year' },
      {
        header: t('type'),
        accessorKey: 'type',
        cell: ({ row }) => {
          return row.original.type === 'linked' ? t('typeLinked') : t('typeExternal')
        },
      },
      {
        header: t('emissions'),
        accessorKey: 'totalCo2',
        cell: ({ row }) => {
          return `${formatNumber(row.original.totalCo2)} ${tUnit(studyUnit)}`
        },
      },
    ]

    if (canEdit) {
      baseColumns.push({
        id: 'actions',
        header: '',
        accessorKey: 'id',
        cell: ({ row }) => (
          <div className="flex justify-end gapped-2">
            {row.original.type === 'external' && (
              <TableActionButton
                type="edit"
                onClick={() => onEdit(row.original)}
                data-testid={`edit-${row.original.type}-study-button`}
              />
            )}
            <TableActionButton
              type="delete"
              onClick={() => handleDeleteClick(row.original.type, row.original.id, row.original.name)}
              data-testid={`delete-${row.original.type}-study-button`}
            />
          </div>
        ),
      })
    }

    return baseColumns
  }, [t, tUnit, handleDeleteClick, onEdit, canEdit, studyUnit])

  const pastStudiesTable = useReactTable({
    columns: mergedColumns,
    data: pastStudies,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      {pastStudies.length > 0 && <BaseTable table={pastStudiesTable} testId="table-past-studies" />}

      {deleteModalOpen && (
        <ConfirmDeleteModal
          open={deleteModalOpen}
          title={tDeleteModal('title')}
          message={tDeleteModal('message')}
          confirmText={tDeleteModal('confirm')}
          cancelText={tDeleteModal('cancel')}
          requireNameMatch={deleteTarget?.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false)
            setDeleteTarget(null)
          }}
        />
      )}
    </>
  )
}

export default LinkedStudiesTable
