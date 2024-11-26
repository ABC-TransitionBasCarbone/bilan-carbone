import { FullStudy } from '@/db/study'
import { OrganizationWithSites } from '@/db/user'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import StudyPerimeter from '../study/perimeter/StudyPerimeter'

interface Props {
  study: FullStudy
  user: User
  organization: OrganizationWithSites
}

const StudyPerimeterPage = async ({ study, user, organization }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.perimeter')

  const userRoleOnStudy = study.allowedUsers.find((right) => right.user.email === user.email)

  return (
    <>
      <Breadcrumbs
        current={tNav('studyPermimeter')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
        ]}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <StudyPerimeter study={study} userRoleOnStudy={userRoleOnStudy} organization={organization} />
      </Block>
    </>
  )
}

export default StudyPerimeterPage
