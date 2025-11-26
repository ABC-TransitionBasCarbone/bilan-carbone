import { getOrganizationVersionAccounts } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { getAccountRoleOnStudy } from '@/utils/study'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import NewStudyRightForm from '../study/rights/NewStudyRightForm'
import NotFound from './NotFound'

interface Props {
  study: FullStudy
  user: UserSession
}
const NewStudyRightPage = async ({ study, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights.new')

  const accounts = await getOrganizationVersionAccounts(study.organizationVersionId)
  const accountRole = getAccountRoleOnStudy(user, study)

  if (!accountRole) {
    return <NotFound />
  }

  const existingAccounts = study.allowedUsers.map((allowedUser) => allowedUser.account.user.email)

  return (
    <>
      <Breadcrumbs
        current={tNav('newStudyRight')}
        links={[
          { label: tNav('home'), link: '/' },
          study.organizationVersion.isCR
            ? {
                label: study.organizationVersion.organization.name,
                link: `/organisations/${study.organizationVersion.id}`,
              }
            : undefined,
          { label: study.name, link: `/etudes/${study.id}` },
          { label: tNav('studyRights'), link: `/etudes/${study.id}/cadrage` },
        ].filter((link) => link !== undefined)}
      />
      <Block title={t('title', { name: study.name })} as="h1">
        <NewStudyRightForm
          study={study}
          accounts={accounts}
          existingAccounts={existingAccounts}
          accountRole={accountRole}
        />
      </Block>
    </>
  )
}

export default NewStudyRightPage
