import React from 'react'
import { User } from 'next-auth'
import { FullStudy } from '@/db/study'
import StudyRightsTable from '../study/rights/StudyRightsTable'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import { Role, StudyRole } from '@prisma/client'
import StudyContributorsTable from '../study/rights/StudyContributorsTable'
import StudyPublicStatus from '../study/rights/StudyPublicStatus'
import StudyLevel from '../study/rights/StudyLevel'

interface Props {
  study: FullStudy
  user: User
}

const StudyRightsPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights')

  const userRoleOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)

  return (
    <>
      <Breadcrumbs
        current={tNav('studyRights')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block
        link={
          user.role === Role.ADMIN || (userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader)
            ? `/etudes/${study.id}/cadrage/ajouter`
            : ''
        }
        linkLabel={t('newRightLink')}
        linkDataTestId="study-rights-change-button"
        title={t('title', { name: study.name })}
        as="h1"
      >
        <StudyLevel study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
        <StudyPublicStatus study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
        <StudyRightsTable study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
      </Block>
      <Block
        title={t('contributors')}
        link={
          user.role === Role.ADMIN || (userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader)
            ? `/etudes/${study.id}/cadrage/ajouter-contributeur`
            : ''
        }
        linkLabel={t('newContributorLink')}
      >
        <StudyContributorsTable study={study} />
      </Block>
    </>
  )
}

export default StudyRightsPage
