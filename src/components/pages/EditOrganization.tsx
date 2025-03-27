import { OrganizationWithSites } from '@/db/account'
import { getUserApplicationSettings } from '@/db/user'
import { defaultCAUnit } from '@/utils/number'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EditOrganizationForm from '../organization/edit/EditOrganizationForm'

interface Props {
  organization: OrganizationWithSites
  user: UserSession
}

const EditOrganizationPage = async ({ organization, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('organization.form')

  const caUnit = (await getUserApplicationSettings(user.accountId))?.caUnit || defaultCAUnit

  return (
    <>
      <Breadcrumbs
        current={tNav('edit')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: organization.name, link: `/organisations/${organization.id}` },
        ]}
      />
      <Block as="h1" title={t('editTitle')}>
        <EditOrganizationForm organization={organization} caUnit={caUnit} />
      </Block>
    </>
  )
}

export default EditOrganizationPage
