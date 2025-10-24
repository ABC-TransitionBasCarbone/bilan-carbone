'use client'

import Title from '@/components/base/Title'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getTrajectories } from '@/services/serverFunctions/trajectory'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import TrajectoryObjectivesTable from '../study/trajectory/TrajectoryObjectivesTable'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'
import styles from './TrajectoryReductionPage.module.css'

interface Props {
  study: FullStudy
  canEdit: boolean
  trajectories: TrajectoryWithObjectives[]
  transitionPlanId: string
}

const ObjectivesPage = ({ study, canEdit, trajectories: initialTrajectories, transitionPlanId }: Props) => {
  const t = useTranslations('study.transitionPlan.objectives')
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const { callServerFunction } = useServerFunction()

  const [trajectories, setTrajectories] = useState<TrajectoryWithObjectives[]>(initialTrajectories)

  const loadTrajectories = useCallback(async () => {
    await callServerFunction(() => getTrajectories(study.id, transitionPlanId), {
      onSuccess: (data) => {
        setTrajectories(data)
      },
      onError: () => {
        setTrajectories([])
      },
    })
  }, [study.id, transitionPlanId, callServerFunction])

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('objectives')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <div className={classNames(styles.container, 'flex-col main-container p2 pt3')}>
        <Title title={t('title')} as="h1" />

        <div className="flex-col gapped2">
          <TransitionPlanOnboarding
            title={t('onboarding.title')}
            description={t('onboarding.description')}
            storageKey="objectives"
            detailedContent={t.rich('onboarding.detailedInfo', {
              br: () => <br />,
            })}
          />

          <TrajectoryObjectivesTable
            trajectories={trajectories}
            canEdit={canEdit}
            transitionPlanId={transitionPlanId}
            onUpdate={loadTrajectories}
          />
        </div>
      </div>
    </>
  )
}

export default ObjectivesPage
