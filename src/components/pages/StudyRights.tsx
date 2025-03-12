import { FullStudy } from '@/db/study'
import { getUserRoleOnStudy, hasEditionRights } from '@/utils/study'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyContributorsTable from '../study/rights/StudyContributorsTable'
import StudyParams from '../study/rights/StudyParams'
import StudyRightsTable from '../study/rights/StudyRightsTable'
import NotFound from './NotFound'

interface Props {
  study: FullStudy
  user: User
}

const StudyRightsPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')

  const userRoleOnStudy = getUserRoleOnStudy(user, study)

  const editionDisabled = !hasEditionRights(userRoleOnStudy)

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

      <StudyParams user={user} study={study} disabled={editionDisabled} />

      <StudyRightsTable study={study} user={user} canAddMember={!editionDisabled} userRoleOnStudy={userRoleOnStudy} />
      <StudyContributorsTable study={study} canAddContributor={!editionDisabled} />
    </>
  )
}

export default StudyRightsPage
