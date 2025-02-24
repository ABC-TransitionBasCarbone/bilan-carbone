import { FullStudy } from '@/db/study'
import { getUserRoleOnStudy } from '@/utils/study'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
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

const StudyRightsPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights')

  const userRoleOnStudy = await getUserRoleOnStudy(user, study)

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
        <StudyLevel study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
        <StudyPublicStatus study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
      </Block>
      <StudyRightsTable study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
      <StudyContributorsTable study={study} user={user} userRoleOnStudy={userRoleOnStudy} />
    </>
  )
}

export default StudyRightsPage
