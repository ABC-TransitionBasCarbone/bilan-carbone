'use client'

import Breadcrumbs from '@/components/breadcrumbs/Breadcrumbs'
import { FullStudy } from '@/db/study'
import { EngagementAction } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import EngagementActions from '../study/engagement/EngagementActions'
import SelectStudySite from '../study/site/SelectStudySite'

interface Props {
  study: FullStudy
  actions: EngagementAction[]
}

const EngagementActionsPage = ({ study, actions }: Props) => {
  const t = useTranslations('study.engagementActions')
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
      <Block title={t('title')} as="h2" rightComponent={<SelectStudySite sites={study.sites} siteSelectionDisabled />}>
        <div className="flex-col gapped2">
          <EngagementActions actions={actions} studyId={study.id} />
        </div>
      </Block>
    </>
  )
}

export default EngagementActionsPage
