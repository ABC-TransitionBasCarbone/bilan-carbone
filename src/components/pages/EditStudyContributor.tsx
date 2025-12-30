import { AccountWithUser } from '@/db/account'
import { getOrganizationVersionAccounts } from '@/db/organization'
import { FullStudy } from '@/db/study'
import { SubPost } from '@prisma/client'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import NewStudyContributorForm from '../study/rights/NewStudyContributorForm'

interface Props {
  study: FullStudy
  account: AccountWithUser
  subPosts: SubPost[]
}

const EditStudyContributorPage = async ({ study, account, subPosts = [] }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('study.rights.newContributor')
  const accounts = await getOrganizationVersionAccounts(study.organizationVersionId)

  return (
    <>
      <Breadcrumbs
        current={tNav('editStudyContributor')}
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
      <Block title={t('titleEdit', { name: study.name })} as="h1">
        <NewStudyContributorForm
          defaultAccount={account}
          study={study}
          accounts={accounts}
          defaultSubPosts={subPosts}
        />
      </Block>
    </>
  )
}

export default EditStudyContributorPage
