'use client'

import { TableActionButton } from '@/components/base/TableActionButton'
import { environmentSubPostsMapping } from '@/services/posts'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { ObjectiveWithScope, TrajectoryWithObjectivesAndScope } from '@/types/trajectory.types'
import { Typography } from '@mui/material'
import { TrajectoryType } from '@repo/db-common/enums'
import { Button } from '@repo/ui'
import { useTranslations } from 'next-intl'
import { useCallback } from 'react'
import type { ObjectiveRow } from './ObjectivesInnerTable'
import ObjectivesInnerTable from './ObjectivesInnerTable'

interface Props {
  trajectory: TrajectoryWithObjectivesAndScope
  canEdit: boolean
  isDefaultSnbc: boolean
  correctedRatesMap: Map<string, { correctedRate: number }>
  defaultObjectiveReferenceYear: number
  sites: Array<{ id: string; name: string }>
  onAddObjective: () => void
  onEditObjective: (objective: ObjectiveWithScope) => void
  onDeleteObjective: (id: string, name: string) => void
  onEditTrajectory: () => void
}

const ObjectivesExpandedRow = ({
  trajectory,
  canEdit,
  isDefaultSnbc,
  correctedRatesMap,
  defaultObjectiveReferenceYear,
  sites,
  onAddObjective,
  onEditObjective,
  onDeleteObjective,
  onEditTrajectory,
}: Props) => {
  const t = useTranslations('study.transitionPlan.objectives')
  const tCommon = useTranslations('common')
  const tPosts = useTranslations('emissionFactors.post')
  const { environment } = useAppEnvironmentStore()

  const sortedObjectives = [...trajectory.objectives].sort((a, b) => a.targetYear - b.targetYear)
  const defaultObjectives = sortedObjectives.filter((o) => o.isDefault)
  const subObjectives = sortedObjectives.filter((o) => !o.isDefault)

  const getScopeItemDisplay = useCallback(
    <T,>(
      items: T[],
      allKey: Parameters<typeof tCommon>[0],
      countKey: Parameters<typeof tCommon>[0],
      getName: (item: T) => string,
    ) => {
      if (items.length === 0) {
        return tCommon(allKey)
      }
      if (items.length > 1) {
        return tCommon(countKey, { count: items.length })
      }
      return items.map(getName).join(', ')
    },
    [tCommon],
  )

  const getSitesDisplay = useCallback(
    (objective: ObjectiveWithScope) =>
      getScopeItemDisplay(
        objective.sites,
        'allSites',
        'xSites',
        (site) => sites.find((s) => s.id === site.studySiteId)?.name ?? site.studySiteId,
      ),
    [getScopeItemDisplay, sites],
  )

  const getSubPostsDisplay = useCallback(
    (objective: ObjectiveWithScope) => {
      const { subPosts } = objective
      let displaySubPosts = [...subPosts]
      const displayPosts: string[] = []

      if (environment) {
        const mapping = environmentSubPostsMapping[environment]
        const subPostSet = new Set(displaySubPosts.map((sp) => sp.subPost))

        for (const [post, mappedSubPosts] of Object.entries(mapping)) {
          const allPresent = mappedSubPosts.every((sp) => subPostSet.has(sp))
          if (allPresent) {
            mappedSubPosts.forEach((sp) => subPostSet.delete(sp))
            displayPosts.push(post)
          }
        }

        displaySubPosts = displaySubPosts.filter((sp) => subPostSet.has(sp.subPost))
      }

      const subPostsEmpty = displaySubPosts.length === 0

      if (displayPosts.length === 0 && subPostsEmpty) {
        return tCommon('allPosts')
      }

      let display = ''
      if (displayPosts.length > 0) {
        display = getScopeItemDisplay(displayPosts, 'allPosts', 'xSubPosts', (post) => tPosts(post))
        if (!subPostsEmpty) {
          display += ` ${tCommon('and')} `
        }
      }

      if (!subPostsEmpty) {
        display += getScopeItemDisplay(displaySubPosts, 'allPosts', 'xSubPosts', (sp) => tPosts(sp.subPost))
      }

      return display
    },
    [environment, getScopeItemDisplay, tCommon, tPosts],
  )

  const getTagsDisplay = useCallback(
    (objective: ObjectiveWithScope) =>
      getScopeItemDisplay(objective.tags, 'allTags', 'xTags', (tag) => tag.studyTag.name),
    [getScopeItemDisplay],
  )

  const getPeriod = (startYear: number, targetYear: number) => `${startYear} → ${targetYear}`

  const isCustom = trajectory.type === TrajectoryType.CUSTOM
  const defaultObjectivesCount = defaultObjectives.length

  const defaultObjectiveRows: ObjectiveRow[] = defaultObjectives.map((objective, index) => {
    const prevYear = index > 0 ? defaultObjectives[index - 1].targetYear : defaultObjectiveReferenceYear
    const corrected = correctedRatesMap.get(objective.id)
    const canEditObj = isCustom && !isDefaultSnbc
    const canDeleteObj = isCustom && !isDefaultSnbc && defaultObjectivesCount > 1

    return {
      id: objective.id,
      period: getPeriod(prevYear, objective.targetYear),
      reductionRate: objective.reductionRate,
      correctedRate: corrected?.correctedRate,
      sites: tCommon('allSites'),
      posts: tCommon('allPosts'),
      tags: tCommon('allTags'),
      onEdit: canEditObj ? onEditTrajectory : undefined,
      onDelete: canDeleteObj
        ? () => onDeleteObjective(objective.id, t('objectiveNumber', { number: index + 1 }))
        : undefined,
    }
  })

  const subObjectiveRows: ObjectiveRow[] = subObjectives.map((objective, index) => {
    const startYear = objective.startYear ?? defaultObjectiveReferenceYear
    const corrected = correctedRatesMap.get(objective.id)

    return {
      id: objective.id,
      period: getPeriod(startYear, objective.targetYear),
      reductionRate: objective.reductionRate,
      correctedRate: corrected?.correctedRate,
      sites: getSitesDisplay(objective),
      posts: getSubPostsDisplay(objective),
      tags: getTagsDisplay(objective),
      onEdit: () => onEditObjective(objective),
      onDelete: () =>
        onDeleteObjective(objective.id, t('objectiveNumber', { number: defaultObjectives.length + index + 1 })),
    }
  })

  return (
    <div className="flex flex-col gapped1 p1 pt-2">
      {defaultObjectives.length > 0 && (
        <ObjectivesInnerTable
          rows={defaultObjectiveRows}
          canEdit={canEdit}
          isDefaultSnbc={isDefaultSnbc}
          title={t('table.defaultObjectives')}
        />
      )}
      <div className="flex flex-col gapped-2">
        <div className="flex align-end justify-between">
          <Typography variant="body1" color="text.secondary">
            {t('table.subObjectives')}
          </Typography>
          {canEdit && subObjectives.length > 0 && <TableActionButton type="add" onClick={onAddObjective} />}
        </div>
        {subObjectives.length > 0 ? (
          <ObjectivesInnerTable rows={subObjectiveRows} canEdit={canEdit} isDefaultSnbc={isDefaultSnbc} />
        ) : (
          <Button variant="outlined" onClick={onAddObjective}>
            {t('table.addSubObjective')}
          </Button>
        )}
      </div>
    </div>
  )
}

export default ObjectivesExpandedRow
