'use client'

import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Block from '../base/Block'
import SelectStudySite from '../study/site/SelectStudySite'
import ObjectivesFilters from '../study/trajectory/ObjectivesFilters'
import TrajectoryObjectivesTable from '../study/trajectory/TrajectoryObjectivesTable'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'

interface Props {
  study: FullStudy
  canEdit: boolean
  trajectories: TrajectoryWithObjectives[]
  transitionPlanId: string
}

const ObjectivesPage = ({ study, canEdit, trajectories, transitionPlanId }: Props) => {
  const t = useTranslations('study.transitionPlan.objectives')
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const router = useRouter()
  const [searchFilter, setSearchFilter] = useState('')

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
      <Block
        title={t('title')}
        as="h2"
        rightComponent={<SelectStudySite sites={study.sites} siteSelectionDisabled isTransitionPlan />}
      >
        <div className="flex-col gapped2">
          <TransitionPlanOnboarding
            title={t('onboarding.title')}
            description={t('onboarding.description')}
            storageKey="objectives"
            detailedContent={t.rich('onboarding.detailedInfo', {
              br: () => <br />,
            })}
          />

          <div className="flex-col gapped1">
            <ObjectivesFilters
              search={searchFilter}
              setSearch={setSearchFilter}
              transitionPlanId={transitionPlanId}
              onTrajectoryCreation={() => router.refresh()}
              canEdit={canEdit}
            />

            <TrajectoryObjectivesTable
              trajectories={trajectories}
              canEdit={canEdit}
              transitionPlanId={transitionPlanId}
              studyId={study.id}
              searchFilter={searchFilter}
            />
          </div>
        </div>
      </Block>
    </>
  )
}

export default ObjectivesPage
