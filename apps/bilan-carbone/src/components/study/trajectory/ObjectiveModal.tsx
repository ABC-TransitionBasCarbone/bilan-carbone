'use client'

import { CustomFormLabel } from '@/components/form/CustomFormLabel'
import ScopeSelectors, { TagFamily } from '@/components/form/ScopeSelectors'
import { OTHER_TAG_ID } from '@/components/form/TagFilter'
import Modal from '@/components/modals/Modal'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getEnvSubPosts } from '@/services/posts'
import { createObjectiveModalSchema, ObjectiveModalFormData } from '@/services/serverFunctions/objective.command'
import { createSubObjectives, updateSubObjective } from '@/services/serverFunctions/objective.serverFunction'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { ObjectiveWithScope, TrajectoryWithObjectivesAndScope } from '@/types/trajectory.types'
import { toScopedValues } from '@/utils/scope.utils'
import { getYearFromDateStr } from '@/utils/time'
import { getDisplayedReferenceYearForTrajectoryType } from '@/utils/trajectory'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import AddObjectiveButton from './AddObjectiveButton'
import ObjectiveCard from './ObjectiveCard'

interface Props {
  open: boolean
  onClose: () => void
  trajectory: TrajectoryWithObjectivesAndScope
  studyYear: number
  onSuccess: () => void
  objective?: ObjectiveWithScope
  sites?: Array<{ id: string; name: string }>
  tagFamilies?: TagFamily[]
}

const ObjectiveModal = ({
  open,
  onClose,
  trajectory,
  studyYear,
  onSuccess,
  objective,
  sites = [],
  tagFamilies = [],
}: Props) => {
  const t = useTranslations('study.transitionPlan.objectiveModal')
  const { environment } = useAppEnvironmentStore()
  const [isLoading, setIsLoading] = useState(false)
  const { callServerFunction } = useServerFunction()
  const isEditing = !!objective

  const allSiteIds = useMemo(() => sites.map((s) => s.id), [sites])
  const allTagIds = useMemo(
    () => [...tagFamilies.flatMap((f) => f.tags.map((tag) => tag.id)), OTHER_TAG_ID],
    [tagFamilies],
  )
  const allEnvSubPosts = useMemo(() => getEnvSubPosts(environment), [environment])
  const referenceYear =
    trajectory.referenceYear ?? getDisplayedReferenceYearForTrajectoryType(trajectory.type, studyYear)

  const defaultValues = objective
    ? {
        siteIds: objective.sites.length > 0 ? objective.sites.map((s) => s.studySiteId) : allSiteIds,
        tagIds: objective.tags.length > 0 ? objective.tags.map((t) => t.studyTagId) : allTagIds,
        subPosts: objective.subPosts.length > 0 ? objective.subPosts.map((sp) => sp.subPost) : allEnvSubPosts,
        objectives: [
          {
            name: objective.name,
            startYear: objective.startYear?.toString(),
            targetYear: objective.targetYear.toString(),
            reductionRate: Number((objective.reductionRate * 100).toFixed(2)),
          },
        ],
      }
    : {
        name: '',
        siteIds: allSiteIds,
        tagIds: allTagIds,
        subPosts: allEnvSubPosts,
        objectives: [{ startYear: '', targetYear: '', reductionRate: 0 }],
      }

  const { control, handleSubmit, watch, reset, setValue, formState } = useForm<ObjectiveModalFormData>({
    defaultValues,
    mode: 'onChange',
    resolver: zodResolver(createObjectiveModalSchema({ hasTagFamilies: tagFamilies.length > 0, referenceYear })),
  })

  const {
    fields: objectives,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'objectives',
  })

  const onSubmit = async (data: ObjectiveModalFormData) => {
    setIsLoading(true)

    const siteIds = toScopedValues(data.siteIds, allSiteIds)
    const tagIds = toScopedValues(data.tagIds ?? [], allTagIds).filter((id) => id !== OTHER_TAG_ID)
    const subPosts = toScopedValues(data.subPosts, allEnvSubPosts)

    if (isEditing && objective) {
      const obj = data.objectives[0]
      if (!obj.targetYear || obj.reductionRate === null || obj.reductionRate === undefined) {
        setIsLoading(false)
        return
      }

      await callServerFunction(
        () =>
          updateSubObjective({
            id: objective.id,
            name: obj.name,
            targetYear: getYearFromDateStr(obj.targetYear!),
            startYear: getYearFromDateStr(obj.startYear!),
            reductionRate: Number((obj.reductionRate! / 100).toFixed(4)),
            siteIds,
            tagIds,
            subPosts,
          }),
        {
          onSuccess: () => {
            onSuccess()
            handleClose()
          },
          onError: () => {
            setIsLoading(false)
          },
        },
      )
    } else {
      const validObjectives = data.objectives.filter(
        (obj) => obj.targetYear && obj.startYear && obj.reductionRate !== null && obj.reductionRate !== undefined,
      )

      if (validObjectives.length === 0) {
        setIsLoading(false)
        throw new Error('No valid objectives, this should not happen')
      }

      const objectivesToCreate = validObjectives.map((obj) => ({
        name: obj.name,
        trajectoryId: trajectory.id,
        targetYear: getYearFromDateStr(obj.targetYear!),
        startYear: getYearFromDateStr(obj.startYear!),
        reductionRate: Number((obj.reductionRate! / 100).toFixed(4)),
        siteIds,
        tagIds,
        subPosts,
      }))

      await callServerFunction(() => createSubObjectives(objectivesToCreate), {
        onSuccess: () => {
          setIsLoading(false)
          onSuccess()
          handleClose()
        },
        onError: () => setIsLoading(false),
      })
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const siteIds = watch('siteIds')
  const tagIds = watch('tagIds')
  const subPosts = watch('subPosts')

  const isValid = formState.isValid

  return (
    <Modal
      label={isEditing ? 'edit-objective' : 'add-objective'}
      open={open}
      onClose={handleClose}
      title={`${isEditing ? t('editTitle') : t('title')} ${trajectory.name}`}
      actions={[
        {
          children: t('cancel'),
          onClick: handleClose,
          variant: 'outlined',
        },
        {
          actionType: 'loadingButton',
          children: isEditing ? t('update') : t('submit'),
          loading: isLoading,
          onClick: handleSubmit(onSubmit),
          disabled: !isValid,
        },
      ]}
    >
      <div className={'flex-col gapped15'}>
        <div className={'flex-col gapped-2'}>
          <CustomFormLabel label={t('scopeSelection')} />

          <ScopeSelectors
            siteIds={siteIds}
            tagIds={tagIds ?? []}
            subPosts={subPosts}
            sites={sites}
            tagFamilies={tagFamilies}
            onSiteIdsChange={(value) => setValue('siteIds', value, { shouldValidate: true })}
            onTagIdsChange={(value) => setValue('tagIds', value, { shouldValidate: true })}
            onSubPostsChange={(value) => setValue('subPosts', value, { shouldValidate: true })}
            isOtherDisabled={true}
            siteIdsError={formState.errors.siteIds?.message}
            subPostsError={formState.errors.subPosts?.message}
            tagIdsError={formState.errors.tagIds?.message}
          />
        </div>

        <div className={'flex-col gapped-2'}>
          <CustomFormLabel label={t('objectives')} />
          <div className={'wrap gapped1'}>
            {objectives.map((obj, index) => (
              <ObjectiveCard
                key={obj.id}
                isEditable={true}
                correctedObjective={null}
                control={control}
                index={index}
                isDefault={false}
                onDelete={!isEditing && objectives.length > 1 ? () => remove(index) : undefined}
              />
            ))}
            {!isEditing && (
              <AddObjectiveButton
                onClick={() => append({ startYear: '', targetYear: '', reductionRate: 0, name: '' })}
              />
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ObjectiveModal
