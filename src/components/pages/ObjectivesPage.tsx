'use client'

import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { customRich } from '@/i18n/customRich'
import { hasAccessToReductionObjectivesGlossary } from '@/services/permissions/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { SectenInfo } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Block from '../base/Block'
import HelpIcon from '../base/HelpIcon'
import GlossaryModal from '../modals/GlossaryModal'
import SelectStudySite from '../study/site/SelectStudySite'
import ObjectivesFilters from '../study/trajectory/ObjectivesFilters'
import TrajectoryObjectivesTable from '../study/trajectory/TrajectoryObjectivesTable'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'

interface Props {
  study: FullStudy
  canEdit: boolean
  trajectories: TrajectoryWithObjectives[]
  transitionPlanId: string
  sectenData: SectenInfo[]
}

const ObjectivesPage = ({ study, canEdit, trajectories, transitionPlanId, sectenData }: Props) => {
  const t = useTranslations('study.transitionPlan.objectives')
  const tGlossary = useTranslations('study.transitionPlan.objectives.glossary')
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const router = useRouter()
  const [searchFilter, setSearchFilter] = useState('')
  const [displayGlossary, setDisplayGlossary] = useState(false)
  const { environment } = useAppEnvironmentStore()

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
        icon={
          environment &&
          hasAccessToReductionObjectivesGlossary(environment) && (
            <HelpIcon onClick={() => setDisplayGlossary(!displayGlossary)} label={tGlossary('label')} />
          )
        }
        iconPosition="after"
        expIcon
      >
        <div className="flex-col gapped2">
          <TransitionPlanOnboarding
            title={t('onboarding.title')}
            description={t('onboarding.description')}
            storageKey="objectives"
            detailedContent={customRich(t, 'onboarding.detailedInfo')}
          />

          <div className="flex-col gapped1">
            <ObjectivesFilters
              search={searchFilter}
              setSearch={setSearchFilter}
              transitionPlanId={transitionPlanId}
              onTrajectoryCreation={() => router.refresh()}
              canEdit={canEdit}
              studyYear={study.startDate.getFullYear()}
              sectenData={sectenData}
            />

            <TrajectoryObjectivesTable
              trajectories={trajectories}
              canEdit={canEdit}
              transitionPlanId={transitionPlanId}
              studyId={study.id}
              studyYear={study.startDate.getFullYear()}
              searchFilter={searchFilter}
              sectenData={sectenData}
            />
          </div>
        </div>
      </Block>
      {displayGlossary && (
        <GlossaryModal
          label="glossary-help-reduction-objectives"
          glossary={'title'}
          t={tGlossary}
          onClose={() => setDisplayGlossary(false)}
        >
          {tGlossary('description')}
        </GlossaryModal>
      )}
    </>
  )
}

export default ObjectivesPage
