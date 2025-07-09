'use client'

import { FullStudy } from '@/db/study'
import { Environment, StudyRole } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import AllPostsInfographyContainer from '../study/infography/AllPostsInfographyContainer'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'

interface Props {
  study: FullStudy
  userRole: StudyRole
  environment: Environment
}

const StudyContributionPage = ({ study, environment }: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const { studySite, setSite } = useStudySite(study)
  return (
    <>
      <Breadcrumbs
        current={tStudyNav('dataEntry')}
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
      <Block title={tStudyNav('dataEntry')} as="h1">
        <div className="mb1">
          <SelectStudySite study={study} studySite={studySite} setSite={setSite} />
        </div>
        <AllPostsInfographyContainer study={study} studySite={studySite} environment={environment} />
      </Block>
    </>
  )
}

export default StudyContributionPage
