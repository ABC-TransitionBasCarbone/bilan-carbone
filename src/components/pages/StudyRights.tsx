'use client'

import { FullStudy } from '@/db/study'
import { getUserRoleOnStudy, hasEditionRights } from '@/utils/study'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyContributorsTable from '../study/rights/StudyContributorsTable'
import StudyLevel from '../study/rights/StudyLevel'
import StudyPublicStatus from '../study/rights/StudyPublicStatus'
import StudyRightsTable from '../study/rights/StudyRightsTable'
import NotFound from './NotFound'

interface Props {
  study: FullStudy
  user: User
}

const StudyRightsPage = ({ study, user }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('study.rights')

  const userRoleOnStudy = getUserRoleOnStudy(user, study)

  const editionDisabled = useMemo(() => !userRoleOnStudy || !hasEditionRights(userRoleOnStudy), [userRoleOnStudy])

  if (!userRoleOnStudy) {
    return <NotFound />
  }

  return (
    <>
      <Breadcrumbs
        current={tNav('studyRights')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organization.isCR
            ? {
                label: study.organization.name,
                link: `/organisations/${study.organization.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
        ].filter((link) => link !== undefined)}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <StudyLevel study={study} user={user} disabled={editionDisabled} />
        <StudyPublicStatus study={study} user={user} disabled={editionDisabled} />
      </Block>
      <StudyRightsTable study={study} user={user} disabled={editionDisabled} userRoleOnStudy={userRoleOnStudy} />
      <StudyContributorsTable study={study} disabled={editionDisabled} />
    </>
  )
}

export default StudyRightsPage
