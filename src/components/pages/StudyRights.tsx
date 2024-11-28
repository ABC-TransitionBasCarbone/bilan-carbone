import { FullStudy } from '@/db/study'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyChangeRightLink from '../study/buttons/StudyChangeRightsLink'
import StudyRightsAddContributorLink from '../study/buttons/StudyRightsAddContributorLink'
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
        Buttons={<StudyChangeRightLink study={study} userRole={user.role} userRoleOnStudy={userRoleOnStudy} />}
        title={t('title', { name: study.name })}
        as="h1"
      >
        <StudyLevel study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
        <StudyPublicStatus study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
        <StudyRightsTable study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
      </Block>
      <Block
        title={t('contributors')}
        Buttons={<StudyRightsAddContributorLink study={study} userRole={user.role} userRoleOnStudy={userRoleOnStudy} />}
      >
        <StudyContributorsTable study={study} />
      </Block>
    </>
  )
}

export default StudyRightsPage
