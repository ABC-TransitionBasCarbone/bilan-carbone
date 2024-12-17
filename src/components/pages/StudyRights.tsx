import { FullStudy } from '@/db/study'
import { Role, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyContributorsTable from '../study/rights/StudyContributorsTable'
import StudyLevel from '../study/rights/StudyLevel'
import StudyPublicStatus from '../study/rights/StudyPublicStatus'
import StudyRightsTable from '../study/rights/StudyRightsTable'

interface Props {
  study: FullStudy
  user: User
}

const StudyRightsPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights')

  const userRoleOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)

  console.log('render StudyRightsPage')
  return (
    <>
      <Breadcrumbs
        current={tNav('studyRights')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <StudyLevel study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
        <StudyPublicStatus study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
      </Block>
      <StudyRightsTable study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
      <Block
        title={t('contributors')}
        actions={
          user.role === Role.ADMIN || (userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader)
            ? [
                {
                  actionType: 'link',
                  href: `/etudes/${study.id}/cadrage/ajouter-contributeur`,
                  'data-testid': 'study-rights-add-contributor',
                  children: t('newContributorLink'),
                },
              ]
            : undefined
        }
      >
        <StudyContributorsTable study={study} />
      </Block>
    </>
  )
}

export default StudyRightsPage
