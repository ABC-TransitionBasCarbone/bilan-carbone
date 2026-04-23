'use client'

import type { TagFamily } from '@/components/form/ScopeSelectors'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteAction } from '@/services/serverFunctions/transitionPlan'
import type { ActionWithRelations } from '@/types/trajectory.types'
import { Typography } from '@mui/material'
import type { StudyResultUnit } from '@repo/db-common'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import ActionFilters, { NO_OWNER } from './ActionFilters'
import ActionTable from './ActionTable'

const ActionModal = dynamic(() => import('./ActionModal'))
const ConfirmDeleteModal = dynamic(() => import('@/components/modals/ConfirmDeleteModal'))

interface Props {
  actions: ActionWithRelations[]
  transitionPlanId: string
  studyUnit: StudyResultUnit
  canEdit: boolean
  studyId: string
  studyRealizationStartDate: string
  sites: Array<{ id: string; name: string }>
  tagFamilies: TagFamily[]
}

const fuseOptions = {
  keys: [{ name: 'title', weight: 1 }],
  threshold: 0.3,
  isCaseSensitive: false,
}

const Actions = ({
  actions,
  studyUnit,
  transitionPlanId,
  canEdit,
  studyId,
  studyRealizationStartDate,
  sites,
  tagFamilies,
}: Props) => {
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const t = useTranslations('study.transitionPlan.actions')

  const [filter, setFilter] = useState('')

  const owners = useMemo(() => {
    const set = new Set<string>()
    for (const action of actions) {
      if (action.owner) {
        set.add(action.owner)
      }
    }
    return Array.from(set).sort()
  }, [actions])

  const [excludedOwners, setExcludedOwners] = useState<string[]>([])

  const ownerFilter = useMemo(
    () => [...owners, NO_OWNER].filter((o) => !excludedOwners.includes(o)),
    [owners, excludedOwners],
  )

  const setOwnerFilter = (selected: string[]) => {
    setExcludedOwners([...owners, NO_OWNER].filter((o) => !selected.includes(o)))
  }
  const [editingAction, setEditingAction] = useState<ActionWithRelations | undefined>(undefined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingAction, setDeletingAction] = useState<ActionWithRelations | undefined>(undefined)

  const fuse = useMemo(() => new Fuse(actions, fuseOptions), [actions])

  const searchedActions: ActionWithRelations[] = useMemo(() => {
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

  const handleOpenEditModal = (action: ActionWithRelations) => {
    setEditingAction(action)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setEditingAction(undefined)
  }

  const handleOpenDeleteModal = (action: ActionWithRelations) => {
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
      <Typography variant="h5" component="h2" fontWeight={600}>
        {t('table.sectionTitle')}
      </Typography>
      <ActionFilters
        search={filter}
        setSearch={setFilter}
        openAddModal={handleOpenAddModal}
        canEdit={canEdit}
        owners={owners}
        ownerFilter={ownerFilter}
        setOwnerFilter={setOwnerFilter}
      />
      <ActionTable
        actions={searchedActions}
        openEditModal={handleOpenEditModal}
        openDeleteModal={handleOpenDeleteModal}
        canEdit={canEdit}
        studyId={studyId}
        studyUnit={studyUnit}
        allSites={sites}
        allOwnerCount={owners.length + 1}
        ownerFilter={ownerFilter}
      />
      {isEditModalOpen && (
        <ActionModal
          open
          onClose={handleCloseEditModal}
          action={editingAction}
          transitionPlanId={transitionPlanId}
          studyUnit={studyUnit}
          studyRealizationStartDate={studyRealizationStartDate}
          sites={sites}
          tagFamilies={tagFamilies}
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
