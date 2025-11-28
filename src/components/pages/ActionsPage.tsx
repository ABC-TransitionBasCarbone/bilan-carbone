'use client'

import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import { ActionWithIndicators } from '@/db/transitionPlan'
import { customRich } from '@/i18n/customRich'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import SelectStudySite from '../study/site/SelectStudySite'
import Actions from '../study/transitionPlan/Actions/Actions'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'

interface Props {
  study: FullStudy
  actions: ActionWithIndicators[]
  transitionPlanId: string
  canEdit: boolean
}

const ActionsPage = ({ study, actions, transitionPlanId, canEdit }: Props) => {
  const t = useTranslations('study.transitionPlan.actions')
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')

  return (
    <>
      <Breadcrumbs
        current={tStudyNav('actionPlan')}
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
            storageKey="actions"
            detailedContent={customRich(t, 'onboarding.detailedInfo')}
          />
          <Actions
            actions={actions}
            studyUnit={study.resultsUnit}
            transitionPlanId={transitionPlanId}
            canEdit={canEdit}
          />
        </div>
      </Block>
    </>
  )
}

export default ActionsPage
