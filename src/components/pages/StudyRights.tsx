import { FullStudy } from '@/db/study'
import { Role, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyContributorsTable from '../study/rights/StudyContributorsTable'
import StudyLevel from '../study/rights/StudyLevel'
import StudyPublicStatus from '../study/rights/StudyPublicStatus'
import StudyRightsTable from '../study/rights/StudyRightsTable'

interface Props {
  study: FullStudy
  user: User
  userRoleOnStudy?: FullStudy['allowedUsers'][0]
}

const StudyRightsPage = ({ study, user, userRoleOnStudy }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('study.rights')

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
