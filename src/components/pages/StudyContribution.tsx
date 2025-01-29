'use client'

import { FullStudy } from '@/db/study'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import AllPostsInfography from '../study/infography/AllPostsInfography'
import SelectStudySite from '../study/site/SelectStudySite'
import useStudySite from '../study/site/useStudySite'

interface Props {
  study: FullStudy
}

const StudyContributionPage = ({ study }: Props) => {
  const tNav = useTranslations('nav')
  const tStudyNav = useTranslations('study.navigation')
  const { studySite, setSite } = useStudySite(study)
  return (
    <>
      <Breadcrumbs
        current={tStudyNav('dataEntry')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organization.isCR
            ? {
                label: study.organization.name,
                link: `/organization/${study.organization.id}`,
              }
            : undefined,

          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <Block title={tStudyNav('dataEntry')} as="h1">
        <div className="mb1">
          <SelectStudySite study={study} studySite={studySite} setSite={setSite} />
        </div>
        <AllPostsInfography study={study} studySite={studySite} />
      </Block>
    </>
  )
}

export default StudyContributionPage
