'use client'

import type { FullStudy } from '@/db/study'
import { StudyRole } from '@repo/db-common/enums'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import AllPostsInfographyContainer from '../study/infography/AllPostsInfographyContainer'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'

interface Props {
  study: FullStudy
  userRole: StudyRole
  user: UserSession
}

const StudyContributionPage = ({ study }: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const { siteId, studySiteId, setSite } = useStudySite(study)

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
      <Block
        title={tStudyNav('dataEntry')}
        as="h2"
        rightComponent={
          <SelectStudySite sites={study.sites} defaultValue={siteId} setSite={setSite} showAllOption={false} />
        }
      >
        <AllPostsInfographyContainer study={study} studySiteId={studySiteId} siteId={siteId} />
      </Block>
    </>
  )
}

export default StudyContributionPage
