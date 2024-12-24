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
  const { site, setSite } = useStudySite(study)
  return (
    <>
      <Breadcrumbs
        current={tStudyNav('dataEntry')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={tStudyNav('dataEntry')} as="h1">
        <div className="mb1">
          <SelectStudySite study={study} site={site} setSite={setSite} />
        </div>
        <AllPostsInfography study={study} site={site} />
      </Block>
    </>
  )
}

export default StudyContributionPage
