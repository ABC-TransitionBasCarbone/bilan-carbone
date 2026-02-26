'use client'

import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import { TrajectoryWithObjectivesAndScope } from '@/db/transitionPlan'
import { customRich } from '@/i18n/customRich'
import { hasAccessToReductionObjectivesGlossary } from '@/services/permissions/environment'
import { getStudyTotalCo2Emissions } from '@/services/study'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import {
  convertToPastStudies,
  getDefaultSnbcSectoralPercentages,
  getDefaultSnbcSectoralTrajectory,
} from '@/utils/trajectory'
import { ExternalStudy, SectenInfo } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import Block from '../base/Block'
import HelpIcon from '../base/HelpIcon'
import GlossaryModal from '../modals/GlossaryModal'
import SelectStudySite from '../study/site/SelectStudySite'
import ObjectiveFilters from '../study/trajectory/ObjectiveFilters'
import ObjectivesTable from '../study/trajectory/ObjectivesTable'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'

interface Props {
  study: FullStudy
  canEdit: boolean
  trajectories: TrajectoryWithObjectivesAndScope[]
  transitionPlanId: string
  sectenData: SectenInfo[]
  linkedStudies: FullStudy[]
  linkedExternalStudies: ExternalStudy[]
  validatedOnly: boolean
}

const ObjectivesPage = ({
  study,
  canEdit,
  trajectories,
  transitionPlanId,
  sectenData,
  linkedStudies,
  linkedExternalStudies,
  validatedOnly,
}: Props) => {
  const t = useTranslations('study.transitionPlan.objectives')
  const tGlossary = useTranslations('study.transitionPlan.objectives.glossary')
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const router = useRouter()
  const [searchFilter, setSearchFilter] = useState('')
  const [displayGlossary, setDisplayGlossary] = useState(false)
  const { environment } = useAppEnvironmentStore()

  const studyTotalEmissions = useMemo(() => {
    return getStudyTotalCo2Emissions(study, true, validatedOnly)
  }, [study, validatedOnly])

  const pastStudiesData = useMemo(() => {
    return convertToPastStudies(linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit)
  }, [linkedStudies, linkedExternalStudies, validatedOnly, study.resultsUnit])

  const defaultSnbcSectoralPercentages = useMemo(() => getDefaultSnbcSectoralPercentages(trajectories), [trajectories])
  const defaultSnbcSectoralTrajectoryId = useMemo(
    () => getDefaultSnbcSectoralTrajectory(trajectories)?.id ?? null,
    [trajectories],
  )

  const sites = useMemo(() => {
    return study.sites.map((s) => ({ id: s.id, name: s.site.name }))
  }, [study.sites])

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
            <ObjectiveFilters
              search={searchFilter}
              setSearch={setSearchFilter}
              transitionPlanId={transitionPlanId}
              onTrajectoryCreation={() => router.refresh()}
              canEdit={canEdit}
              studyYear={study.startDate.getFullYear()}
              sectenData={sectenData}
              studyEmissions={studyTotalEmissions}
              pastStudies={pastStudiesData}
              defaultSnbcSectoralPercentages={defaultSnbcSectoralPercentages}
            />

            <ObjectivesTable
              trajectories={trajectories}
              canEdit={canEdit}
              transitionPlanId={transitionPlanId}
              studyId={study.id}
              studyYear={study.startDate.getFullYear()}
              searchFilter={searchFilter}
              sectenData={sectenData}
              studyEmissions={studyTotalEmissions}
              pastStudies={pastStudiesData}
              sites={sites}
              tagFamilies={study.tagFamilies}
              defaultSnbcSectoralTrajectoryId={defaultSnbcSectoralTrajectoryId}
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
