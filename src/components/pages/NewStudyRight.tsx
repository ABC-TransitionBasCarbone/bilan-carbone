import { getOrganizationUsers } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { getUserRoleOnStudy } from '@/utils/study'
import { User } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import NewStudyRightForm from '../study/rights/NewStudyRightForm'
import NotFound from './NotFound'

interface Props {
  study: FullStudy
  user: User
}
const NewStudyRightPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights.new')

  const users = await getOrganizationUsers(user.organizationId)
  const userRole = await getUserRoleOnStudy(user, study)

  if (!userRole) {
    return <NotFound />
  }

  const existingUsers = study.allowedUsers.map((allowedUser) => allowedUser.user.email)
  const filteredUsers = users.filter((user) => !existingUsers.includes(user.email))
  return (
    <>
      <Breadcrumbs
        current={tNav('newStudyRight')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organization.isCR
            ? {
                label: study.organization.name,
                link: `/organisations/${study.organization.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
          { label: tNav('studyRights'), link: `/etudes/${study.id}/cadrage` },
        ].filter((link) => link !== undefined)}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <NewStudyRightForm study={study} users={filteredUsers} existingUsers={existingUsers} userRole={userRole} />
      </Block>
    </>
  )
}

export default NewStudyRightPage
