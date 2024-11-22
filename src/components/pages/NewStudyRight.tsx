import Block from '../base/Block'
import NewStudyRightForm from '../study/rights/NewStudyRightForm'
import { getOrganizationUsers } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { User } from 'next-auth'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import { getTranslations } from 'next-intl/server'

interface Props {
  study: FullStudy
  user: User
}
const NewStudyRightPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights.new')

  const users = await getOrganizationUsers(user.organizationId)
  const existingUsers = study.allowedUsers.map((allowedUser) => allowedUser.user.email)
  const filteredUsers = users.filter((user) => !existingUsers.includes(user.email))
  return (
    <>
      <Breadcrumbs
        current={tNav('newStudyRight')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: study.name, link: `/etudes/${study.id}` },
          { label: tNav('studyRights'), link: `/etudes/${study.id}/cadrage` },
        ]}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <NewStudyRightForm study={study} user={user} users={filteredUsers} />
      </Block>
    </>
  )
}

export default NewStudyRightPage
