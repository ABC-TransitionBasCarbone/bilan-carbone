'use client'

import SubPostSelector from '@/components/emissionFactor/Form/SubPostSelector'
import { SiteMultiSelect } from '@/components/form/SiteMultiSelect'
import { TagMultiSelect } from '@/components/form/TagMultiSelect'
import Modal from '@/components/modals/Modal'
import { ObjectiveWithScope, TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  createObjective,
  getStudySitesForTrajectory,
  getStudyTagsForTrajectory,
  updateObjective,
} from '@/services/serverFunctions/objective.serverFunction'
import { getYearFromDateStr } from '@/utils/time'
import AddIcon from '@mui/icons-material/Add'
import { Typography } from '@mui/material'
import { SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
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
  const tTrajectory = useTranslations('study.transitionPlan.trajectoryModal')
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
      getStudySitesForTrajectory(studyId),
      getStudyTagsForTrajectory(studyId),
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
          updateObjective({
            id: objective.id,
            targetYear: getYearFromDateStr(obj.targetYear!),
            reductionRate: Number((obj.reductionRate! / 100).toFixed(4)),
            siteIds: data.siteIds,
            tagIds: data.tagIds,
            subPosts: data.subPosts,
          }),
        {
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

      for (const objectiveToCreate of objectivesToCreate) {
        await callServerFunction(() => createObjective(objectiveToCreate), {
          onError: () => {
            setIsLoading(false)
          },
        })
      }
    }

    setIsLoading(false)
    onSuccess()
    handleClose()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const siteIds = watch('siteIds')
  const tagIds = watch('tagIds')
  const subPosts = watch('subPosts')

  const hasScope = siteIds.length > 0 || tagIds.length > 0 || subPosts.length > 0
  const isValid = formState.isValid && hasScope

  return (
    <Modal
      label={isEditing ? 'edit-objective' : 'add-objective'}
      open={open}
      onClose={handleClose}
      title={isEditing ? t('editTitle') : t('title')}
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
      <div className={styles.container}>
        <Typography variant="body2" color="textSecondary" className={styles.trajectoryInfo}>
          {tTrajectory('trajectory')}: <strong>{trajectory.name}</strong> ({tTrajectory(`type.${trajectory.type}`)})
        </Typography>

        <Typography variant="h6" className={styles.sectionTitle}>
          {t('scopeSelection')}
        </Typography>

        <div className={styles.selectorsContainer}>
          <SiteMultiSelect sites={sites} value={siteIds} onChange={(value) => reset({ ...watch(), siteIds: value })} />

          <TagMultiSelect tags={tags} value={tagIds} onChange={(value) => reset({ ...watch(), tagIds: value })} />

          <SubPostSelector
            isAllPosts={true}
            selectedSubPosts={subPosts}
            sortedSubPosts={[]}
            onSelectSubPost={(value) => reset({ ...watch(), subPosts: value })}
          />
        </div>

        <Typography variant="h6" className={styles.sectionTitle}>
          {t('objectives')}
        </Typography>

        <div className={styles.objectivesContainer}>
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

          {!isEditing && (
            <div
              onClick={() => append({ targetYear: null, reductionRate: null })}
              className={styles.addObjectiveButton}
            >
              <AddIcon fontSize="large" />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ObjectiveModal
