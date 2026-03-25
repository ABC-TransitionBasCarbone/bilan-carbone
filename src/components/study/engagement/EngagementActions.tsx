'use client'

import ConfirmDeleteModal from '@/components/modals/ConfirmDeleteModal'
import { EngagementActionSteps, EngagementActionTargets } from '@/constants/engagementActions'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { deleteEngagementAction, EngagementActionWithSites } from '@/services/serverFunctions/study'
import { EngagementActionsFilters } from '@/types/filters'
import { getTranslatedMapping } from '@/utils/array'
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
  studySite: string
}

const EngagementActions = ({ actions, study, studySite }: Props) => {
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const t = useTranslations('study.transitionPlan.actions')
  const tPhases = useTranslations('study.engagementActions.phases')
  const tSteps = useTranslations('study.engagementActions.steps')
  const tTargets = useTranslations('study.engagementActions.targets')

  const defaultFilters = useMemo<EngagementActionsFilters>(() => {
    const enumStepsValues = Object.values(EngagementActionSteps)
    const phasesValues = Object.values(EngagementPhase)

    const enumTargetsValues = Object.values(EngagementActionTargets)
    const customTargets = actions
      .flatMap((action) => action.targets || [])
      .filter((target) => !enumTargetsValues.includes(target as EngagementActionTargets))
    const targetsValues = [...enumTargetsValues, ...customTargets]

    const customStepsValues = actions
      .map((action) => action.steps)
      .filter((step) => !enumStepsValues.includes(step as EngagementActionSteps))
    const stepsValues = [...enumStepsValues, ...customStepsValues]

    return {
      search: '',
      steps: stepsValues,
      targets: targetsValues,
      phases: phasesValues,
      dateRange: { startDate: null, endDate: null },
    }
  }, [actions])

  const [filters, setFilters] = useState<EngagementActionsFilters>(defaultFilters)
  const [editingAction, setEditingAction] = useState<EngagementActionWithSites | undefined>(undefined)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deletingAction, setDeletingAction] = useState<EngagementActionWithSites | undefined>(undefined)

  const stepTranslatedMapping = getTranslatedMapping(Object.values(EngagementActionSteps), tSteps)
  const targetTranslatedMapping = getTranslatedMapping(Object.values(EngagementActionTargets), tTargets)
  const phaseTranslatedMapping = getTranslatedMapping(Object.values(EngagementPhase), tPhases)

  const fuseOptions = useMemo(
    () => ({
      keys: [
        { name: 'name', weight: 3 },
        { name: 'description', weight: 2 },
        {
          name: 'steps',
          weight: 1,
          getFn: (item: EngagementActionWithSites) => {
            return stepTranslatedMapping[item.steps] || item.steps
          },
        },
        {
          name: 'targets',
          weight: 1,
          getFn: (item: EngagementActionWithSites) => {
            return (
              item.targets
                .map((target) => {
                  return targetTranslatedMapping[target] || target
                })
                .join(' ') || ''
            )
          },
        },
        {
          name: 'phase',
          weight: 1,
          getFn: (item: EngagementActionWithSites) => {
            return phaseTranslatedMapping[item.phase] || item.phase
          },
        },
        { name: 'sites.site.name', weight: 1 },
      ],
      threshold: 0.3,
      isCaseSensitive: false,
    }),
    [stepTranslatedMapping, targetTranslatedMapping, phaseTranslatedMapping],
  )

  const fuse = useMemo(() => new Fuse(actions, fuseOptions), [actions, fuseOptions])

  const filteredActions: EngagementActionWithSites[] = useMemo(() => {
    let results = actions

    if (filters.search) {
      results = fuse.search(filters.search).map(({ item }) => item)
    }

    results = results.filter((action) => filters.steps.includes(action.steps as EngagementActionSteps))

    results = results.filter((action) =>
      action.targets?.some((target) => filters.targets.includes(target as EngagementActionTargets)),
    )

    results = results.filter((action) => filters.phases.includes(action.phase))

    if (studySite) {
      results = results.filter((action) => action.sites?.some((site) => site.id === studySite))
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
  }, [actions, filters, fuse, studySite])

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
        openAddModal={handleOpenAddModal}
        canEdit
        actions={actions}
      />
      <EngagementActionTable
        actions={filteredActions}
        studySites={study.sites}
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
