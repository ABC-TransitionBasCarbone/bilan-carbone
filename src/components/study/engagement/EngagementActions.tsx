'use client'

import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteEngagementAction, EngagementActionWithSites } from '@/services/serverFunctions/study'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import ActionFilters from '../transitionPlan/Actions/ActionFilters'
import EngagementActionModal from './EngagementActionModal'
import EngagementActionTable from './EngagementActionTable'

interface Props {
  actions: EngagementActionWithSites[]
  study: FullStudy
}

const fuseOptions = {
  keys: [{ name: 'name', weight: 1 }],
  threshold: 0.3,
  isCaseSensitive: false,
}

const EngagementActions = ({ actions, study }: Props) => {
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const t = useTranslations('study.transitionPlan.actions')

  const [filter, setFilter] = useState('')
  const [editingAction, setEditingAction] = useState<EngagementActionWithSites | undefined>(undefined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingAction, setDeletingAction] = useState<EngagementActionWithSites | undefined>(undefined)

  const fuse = useMemo(() => new Fuse(actions, fuseOptions), [actions])

  const searchedActions: EngagementActionWithSites[] = useMemo(() => {
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

  const handleOpenEditModal = (action: EngagementActionWithSites) => {
    setEditingAction(action)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingAction(undefined)
  }

  const handleOpenDeleteModal = (action: EngagementActionWithSites) => {
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

    await callServerFunction(() => deleteEngagementAction(deletingAction.id, study.id), {
      onSuccess: () => {
        router.refresh()
      },
    })
    handleCloseDeleteModal()
  }

  return (
    <div className="flex-col gapped1">
      <ActionFilters search={filter} setSearch={setFilter} openAddModal={handleOpenAddModal} canEdit />
      <EngagementActionTable
        actions={searchedActions}
        openEditModal={handleOpenEditModal}
        openDeleteModal={handleOpenDeleteModal}
      />
      {isEditModalOpen && (
        <EngagementActionModal open onClose={handleCloseEditModal} action={editingAction} study={study} />
      )}

      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          open={isDeleteModalOpen}
          onCancel={handleCloseDeleteModal}
          onConfirm={handleConfirmDeleteAction}
          title={t('deleteModal.title')}
          message={t('deleteModal.message')}
          confirmText={t('deleteModal.confirm')}
          requireNameMatch={deletingAction?.name}
        />
      )}
    </div>
  )
}

export default EngagementActions
