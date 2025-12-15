'use client'

import { ActionWithIndicators } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteAction } from '@/services/serverFunctions/transitionPlan'
import type { StudyResultUnit } from '@prisma/client'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import ActionFilters from './ActionFilters'
import ActionTable from './ActionTable'

const ActionModal = dynamic(() => import('./ActionModal'))
const ConfirmDeleteModal = dynamic(() => import('@/components/modals/ConfirmDeleteModal'))

interface Props {
  actions: ActionWithIndicators[]
  transitionPlanId: string
  studyUnit: StudyResultUnit
  canEdit: boolean
  studyId: string
}

const fuseOptions = {
  keys: [{ name: 'title', weight: 1 }],
  threshold: 0.3,
  isCaseSensitive: false,
}

const Actions = ({ actions, studyUnit, transitionPlanId, canEdit, studyId }: Props) => {
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const t = useTranslations('study.transitionPlan.actions')

  const [filter, setFilter] = useState('')
  const [editingAction, setEditingAction] = useState<ActionWithIndicators | undefined>(undefined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingAction, setDeletingAction] = useState<ActionWithIndicators | undefined>(undefined)

  const fuse = useMemo(() => new Fuse(actions, fuseOptions), [actions])

  const searchedActions: ActionWithIndicators[] = useMemo(() => {
    if (!filter) {
      return actions
    }
    const searchResults = filter ? fuse.search(filter).map(({ item }) => item) : actions

    return searchResults
  }, [actions, filter, fuse])

  const handleOpenAddModal = () => {
    setEditingAction(undefined)
    setIsEditModalOpen(true)
  }

  const handleOpenEditModal = (action: ActionWithIndicators) => {
    setEditingAction(action)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingAction(undefined)
  }

  const handleOpenDeleteModal = (action: ActionWithIndicators) => {
    setDeletingAction(action)
    setIsDeleteModalOpen(true)
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeletingAction(undefined)
  }

  const handleConfirmDeleteAction = async () => {
    if (!deletingAction) {
      return
    }

    await callServerFunction(() => deleteAction(deletingAction.id), {
      onSuccess: () => {
        router.refresh()
      },
    })
    handleCloseDeleteModal()
  }

  return (
    <div className="flex-col gapped1">
      <ActionFilters search={filter} setSearch={setFilter} openAddModal={handleOpenAddModal} canEdit={canEdit} />
      <ActionTable
        actions={searchedActions}
        openEditModal={handleOpenEditModal}
        openDeleteModal={handleOpenDeleteModal}
        canEdit={canEdit}
        studyId={studyId}
        studyUnit={studyUnit}
      />
      {isEditModalOpen && (
        <ActionModal
          open
          onClose={handleCloseEditModal}
          action={editingAction}
          transitionPlanId={transitionPlanId}
          studyUnit={studyUnit}
        />
      )}
      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          open={isDeleteModalOpen}
          onCancel={handleCloseDeleteModal}
          onConfirm={handleConfirmDeleteAction}
          title={t('deleteModal.title')}
          message={t('deleteModal.message')}
          confirmText={t('deleteModal.confirm')}
          requireNameMatch={deletingAction?.title}
        />
      )}
    </div>
  )
}

export default Actions
