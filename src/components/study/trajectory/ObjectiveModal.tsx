'use client'

import MultiSelectAll from '@/components/base/MultiSelectAll'
import { PostSubPostFilter } from '@/components/form/PostSubPostFilter'
import Modal from '@/components/modals/Modal'
import { ObjectiveWithScope, TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import { environmentPostMapping, environmentSubPostsMapping, Post } from '@/services/posts'
import { createSubObjective, updateSubObjective } from '@/services/serverFunctions/objective.serverFunction'
import { getStudySitesByStudyId } from '@/services/serverFunctions/studySite.serverFunction'
import { getStudyTagsByStudyId } from '@/services/serverFunctions/tag.serverFunction'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { getYearFromDateStr } from '@/utils/time'
import { FormControl, FormLabel, Typography } from '@mui/material'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import AddObjectiveButton from './AddObjectiveButton'
import ObjectiveCard from './ObjectiveCard'
import styles from './ObjectiveModal.module.css'

interface ObjectiveFormData {
  targetYear: string | null
  reductionRate: number | null
}

export interface ObjectiveModalFormData {
  siteIds: string[]
  tagIds: string[]
  subPosts: SubPost[]
  objectives: ObjectiveFormData[]
}

interface Props {
  open: boolean
  onClose: () => void
  trajectory: TrajectoryWithObjectivesAndScope
  studyId: string
  onSuccess: () => void
  objective?: ObjectiveWithScope
}

const ObjectiveModal = ({ open, onClose, trajectory, studyId, onSuccess, objective }: Props) => {
  const t = useTranslations('study.transitionPlan.objectiveModal')
  const { environment } = useAppEnvironmentStore()
  const [isLoading, setIsLoading] = useState(false)
  const { callServerFunction } = useServerFunction()
  const [sites, setSites] = useState<Array<{ id: string; name: string }>>([])
  const [tags, setTags] = useState<
    Array<{ id: string; name: string; color: string | null; family: { id: string; name: string } }>
  >([])
  const isEditing = !!objective

  const { control, handleSubmit, watch, reset, formState } = useForm<ObjectiveModalFormData>({
    defaultValues: {
      siteIds: [],
      tagIds: [],
      subPosts: [],
      objectives: [{ targetYear: null, reductionRate: null }],
    },
    mode: 'onChange',
  })

  const {
    fields: objectives,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'objectives',
  })

  const fetchScopeOptions = useCallback(async () => {
    const [sitesResponse, tagsResponse] = await Promise.all([
      getStudySitesByStudyId(studyId),
      getStudyTagsByStudyId(studyId),
    ])
    if (sitesResponse.success && sitesResponse.data) {
      setSites(sitesResponse.data.map((s) => ({ id: s.id, name: s.site.name })))
    }
    if (tagsResponse.success && tagsResponse.data) {
      setTags(tagsResponse.data)
    }
  }, [studyId])

  useEffect(() => {
    if (open) {
      fetchScopeOptions()

      if (objective) {
        const siteIds = objective.sites.map((s) => s.studySiteId)
        const tagIds = objective.tags.map((t) => t.studyTagId)
        const subPosts = objective.subPosts.map((sp) => sp.subPost)

        reset({
          siteIds,
          tagIds,
          subPosts,
          objectives: [
            {
              targetYear: objective.targetYear.toString(),
              reductionRate: Number((objective.reductionRate * 100).toFixed(2)),
            },
          ],
        })
      }
    }
  }, [open, fetchScopeOptions, objective, reset])

  const onSubmit = async (data: ObjectiveModalFormData) => {
    setIsLoading(true)

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
            targetYear: getYearFromDateStr(obj.targetYear!),
            reductionRate: Number((obj.reductionRate! / 100).toFixed(4)),
            siteIds: data.siteIds,
            tagIds: data.tagIds,
            subPosts: data.subPosts,
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
        (obj) => obj.targetYear && obj.reductionRate !== null && obj.reductionRate !== undefined,
      )

      if (validObjectives.length === 0) {
        setIsLoading(false)
        return
      }

      const objectivesToCreate = validObjectives.map((obj) => ({
        trajectoryId: trajectory.id,
        targetYear: getYearFromDateStr(obj.targetYear!),
        reductionRate: Number((obj.reductionRate! / 100).toFixed(4)),
        siteIds: data.siteIds,
        tagIds: data.tagIds,
        subPosts: data.subPosts,
      }))

      let allSuccess = true
      for (const objectiveToCreate of objectivesToCreate) {
        await callServerFunction(() => createSubObjective(objectiveToCreate), {
          onError: () => {
            allSuccess = false
            setIsLoading(false)
          },
        })
      }

      if (allSuccess) {
        setIsLoading(false)
        onSuccess()
        handleClose()
      }
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const siteIds = watch('siteIds')
  const tagIds = watch('tagIds')
  const subPosts = watch('subPosts')
  const objectivesData = watch('objectives')

  const hasScope = siteIds.length > 0 || tagIds.length > 0 || subPosts.length > 0
  const hasValidObjective = objectivesData.some(
    (obj) => obj.targetYear && obj.reductionRate !== null && obj.reductionRate !== undefined,
  )
  const isValid = formState.isValid && hasScope && hasValidObjective

  const envPosts = (environment ? Object.values(environmentPostMapping[environment]) : []) as Post[]
  const envSubPosts = environment
    ? Object.values(environmentSubPostsMapping[environment])
        .flat()
        .filter((sp, index, self) => self.indexOf(sp) === index)
    : []

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
          <Typography variant="h6">{t('scopeSelection')}</Typography>

          <div className={classNames('grid', 'gapped1', styles.scopeGrid)}>
            <div className={'flex-col'}>
              <FormLabel component="legend">{t('sites')}</FormLabel>
              <FormControl fullWidth disabled={sites.length === 0}>
                <MultiSelectAll
                  id="sites"
                  values={siteIds}
                  allValues={sites.map((s) => s.id)}
                  setValues={(value) => reset({ ...watch(), siteIds: value })}
                  getLabel={(id) => sites.find((s) => s.id === id)?.name || id}
                />
              </FormControl>
            </div>

            <div className={'flex-col'}>
              <FormLabel component="legend">{t('tags')}</FormLabel>
              <FormControl fullWidth disabled={tags.length === 0}>
                <MultiSelectAll
                  id="tags"
                  values={tagIds}
                  allValues={tags.map((tag) => tag.id)}
                  setValues={(value) => reset({ ...watch(), tagIds: value })}
                  getLabel={(id) => tags.find((tag) => tag.id === id)?.name || id}
                />
              </FormControl>
            </div>

            <div className={'flex-col'}>
              <FormControl fullWidth>
                <PostSubPostFilter
                  className={classNames('w100', styles.postSubPostFilter)}
                  envPosts={envPosts}
                  envSubPosts={envSubPosts}
                  selectedSubPosts={subPosts}
                  onChange={(value) => reset({ ...watch(), subPosts: value })}
                  showSeparateLabel={true}
                />
              </FormControl>
            </div>
          </div>
        </div>

        <div className={'flex-col gapped-2'}>
          <Typography variant="h6">{t('objectives')}</Typography>

          <div className={'wrap gapped1'}>
            {objectives.map((obj, index) => (
              <ObjectiveCard
                key={obj.id}
                isEditable={true}
                correctedObjective={null}
                control={control}
                index={index}
                onDelete={!isEditing && objectives.length > 1 ? () => remove(index) : undefined}
              />
            ))}

            {!isEditing && <AddObjectiveButton onClick={() => append({ targetYear: null, reductionRate: null })} />}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default ObjectiveModal
