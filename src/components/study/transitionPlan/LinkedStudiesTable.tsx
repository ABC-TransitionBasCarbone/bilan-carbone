'use client'

import BaseTable from '@/components/base/Table'
import { TableActionButton } from '@/components/base/TableActionButton'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteExternalStudy, deleteLinkedStudy } from '@/services/serverFunctions/transitionPlan'
import { ExternalStudy } from '@prisma/client'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'

const ConfirmDeleteModal = dynamic(() => import('../../modals/ConfirmDeleteModal'))

interface Props {
  transitionPlanId: string
  linkedStudies: FullStudy[]
  externalStudies: ExternalStudy[]
  canEdit: boolean
}

type Study = {
  id: string
  name: string
  year: number
  type: 'linked' | 'external'
}

const LinkedStudiesTable = ({ transitionPlanId, linkedStudies, externalStudies, canEdit }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.linkedStudies.table')
  const tDeleteModal = useTranslations('study.transitionPlan.trajectories.linkedStudies.deleteModal')
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

  const mergedStudies = useMemo(
    () =>
      [
        ...linkedStudies.map((study) => ({
          id: study.id,
          name: study.name,
          year: study.startDate.getFullYear(),
          type: 'linked' as const,
        })),
        ...externalStudies.map((study) => ({
          id: study.id,
          name: study.name,
          year: study.date.getFullYear(),
          type: 'external' as const,
        })),
      ].sort((a, b) => a.year - b.year),
    [linkedStudies, externalStudies],
  )

  const mergedColumns = useMemo(
    () =>
      [
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
          id: 'actions',
          header: '',
          accessorKey: 'id',
          cell: ({ row }) => (
            <TableActionButton
              type="delete"
              onClick={() => handleDeleteClick(row.original.type, row.original.id, row.original.name)}
              data-testid={`delete-${row.original.type}-study-button`}
            />
          ),
        },
      ] as ColumnDef<Study>[],
    [t, handleDeleteClick],
  )

  const mergedTable = useReactTable({
    columns: mergedColumns,
    data: mergedStudies,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      {mergedStudies.length > 0 && <BaseTable table={mergedTable} testId="table-merged-studies" />}

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
