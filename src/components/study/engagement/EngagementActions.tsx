'use client'

import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal'
import { EngagementActionSteps, EngagementActionTargets } from '@/constants/engagementActions'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteEngagementAction, EngagementActionWithSites } from '@/services/serverFunctions/study'
import { EngagementActionsFilters } from '@/types/filters'
import { EngagementPhase } from '@prisma/client'
import Fuse from 'fuse.js'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import EngagementActionModal from './EngagementActionModal'
import EngagementActionTable from './EngagementActionTable'
import EngagementActionsFiltersComponent from './EngagementActionsFiltersComponent'

interface Props {
  actions: EngagementActionWithSites[]
  study: FullStudy
}

const fuseOptions = {
  keys: [
    { name: 'name', weight: 3 },
    { name: 'description', weight: 2 },
    { name: 'steps', weight: 1 },
    { name: 'targets', weight: 1 },
    { name: 'phase', weight: 1 },
    { name: 'sites.site.name', weight: 1 },
  ],
  threshold: 0.3,
  isCaseSensitive: false,
}

const EngagementActions = ({ actions, study }: Props) => {
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const t = useTranslations('study.transitionPlan.actions')

  const siteOptions = useMemo(() => {
    const sites = new Set<string>()
    actions.forEach((action) => {
      action.sites?.forEach((site) => sites.add(site.site.name))
    })
    return Array.from(sites).sort()
  }, [actions])

  const defaultFilters = useMemo<EngagementActionsFilters>(() => {
    const stepsValues = Object.values(EngagementActionSteps)
    const targetsValues = Object.values(EngagementActionTargets)
    const phasesValues = Object.values(EngagementPhase)

    return {
      search: '',
      steps: [...stepsValues, 'all'],
      targets: [...targetsValues, 'all'],
      phases: [...phasesValues, 'all'],
      sites: siteOptions.length > 0 ? [...siteOptions, 'all'] : ['all'],
      dateRange: { startDate: null, endDate: null },
    }
  }, [siteOptions])

  const [filters, setFilters] = useState<EngagementActionsFilters>(defaultFilters)
  const [editingAction, setEditingAction] = useState<EngagementActionWithSites | undefined>(undefined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingAction, setDeletingAction] = useState<EngagementActionWithSites | undefined>(undefined)

  const fuse = useMemo(() => new Fuse(actions, fuseOptions), [actions])

  const filteredActions: EngagementActionWithSites[] = useMemo(() => {
    let results = actions

    if (filters.search) {
      results = fuse.search(filters.search).map(({ item }) => item)
    }

    if (!filters.steps.includes('all')) {
      results = results.filter((action) => filters.steps.includes(action.steps as EngagementActionSteps | 'all'))
    }

    if (!filters.targets.includes('all')) {
      results = results.filter((action) =>
        action.targets?.some((target) => filters.targets.includes(target as EngagementActionTargets | 'all')),
      )
    }

    if (!filters.phases.includes('all')) {
      results = results.filter((action) => filters.phases.includes(action.phase))
    }

    if (!filters.sites.includes('all')) {
      results = results.filter((action) => action.sites?.some((site) => filters.sites.includes(site.site.name)))
    }

    if (filters.dateRange.startDate || filters.dateRange.endDate) {
      results = results.filter((action) => {
        const actionDate = new Date(action.date)
        actionDate.setHours(0, 0, 0, 0)

        const startDate = filters.dateRange.startDate ? new Date(filters.dateRange.startDate) : null
        if (startDate) {
          startDate.setHours(0, 0, 0, 0)
        }

        const endDate = filters.dateRange.endDate ? new Date(filters.dateRange.endDate) : null
        if (endDate) {
          endDate.setHours(23, 59, 59, 999)
        }

        if (startDate && actionDate < startDate) {
          return false
        }
        if (endDate && actionDate > endDate) {
          return false
        }
        return true
      })
    }

    return results
  }, [actions, filters, fuse])

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
      <EngagementActionsFiltersComponent
        filters={filters}
        setFilters={setFilters}
        siteOptions={siteOptions}
        openAddModal={handleOpenAddModal}
        canEdit
      />
      <EngagementActionTable
        actions={filteredActions}
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
