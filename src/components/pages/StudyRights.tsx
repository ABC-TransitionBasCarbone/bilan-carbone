import React from 'react'
import { User } from 'next-auth'
import { FullStudy } from '@/db/study'
import StudyRightsTable from '../study/rights/StudyRightsTable'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import { Role, StudyRole } from '@prisma/client'
import StudyContributorsTable from '../study/rights/StudyContributorsTable'

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
            ? `/etudes/${study.id}/droits/ajouter`
            : ''
        }
        linkLabel={t('new-right')}
        linkDataTestId="study-rights-change-button"
        title={t('title', { name: study.name })}
        as="h1"
      >
        <StudyRightsTable study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
      </Block>
      <Block
        title={t('contributors')}
        link={
          user.role === Role.ADMIN || (userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader)
            ? `/etudes/${study.id}/droits/ajouter-contributeur`
            : ''
        }
        linkLabel={t('new-contributor')}
      >
        <StudyContributorsTable study={study} />
      </Block>
    </>
  )
}

export default StudyRightsPage
