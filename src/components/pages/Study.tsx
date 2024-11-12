import { Study } from '@prisma/client'
import { useTranslations } from 'next-intl'
import React from 'react'
import StudyDetails from '../study/StudyDetails'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

interface Props {
  study: Study
}

const StudyPage = ({ study }: Props) => {
  const tNav = useTranslations('nav')

  return (
    <>
      <Breadcrumbs current={study.name} links={[{ label: tNav('home'), link: '/' }]} />
      <StudyDetails study={study} />
    </>
  )
}

export default StudyPage
