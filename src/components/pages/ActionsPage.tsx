'use client'

import Title from '@/components/base/Title'
import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import TransitionPlanOnboarding from '../study/transitionPlan/TransitionPlanOnboarding'
import styles from './TrajectoryReductionPage.module.css'

interface Props {
  study: FullStudy
  canEdit: boolean
}

const ActionsPage = ({ study, canEdit }: Props) => {
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
      <div className={classNames(styles.container, 'main-container', 'p2', 'pt3')}>
        <Title title={t('title')} as="h1" />

        <TransitionPlanOnboarding
          title={t('onboarding.title')}
          description={t('onboarding.description')}
          storageKey="actions"
          detailedContent={t.rich('onboarding.detailedInfo', {
            p: (chunks) => <p>{chunks}</p>,
          })}
        />
      </div>
    </>
  )
}

export default ActionsPage
