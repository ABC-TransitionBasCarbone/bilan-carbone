import { OrganizationWithSites } from '@/db/account'
import { getUserApplicationSettings } from '@/db/user'
import { CA_UNIT_VALUES, defaultCAUnit } from '@/utils/number'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EditOrganizationForm from '../organization/edit/EditOrganizationForm'

interface Props {
  organizationVersion: OrganizationWithSites
  user: UserSession
}

const EditOrganizationPage = async ({ organizationVersion, user }: Props) => {
  const tNav = await getTranslations('nav')
  const t = await getTranslations('organization.form')

  const userCAUnit = (await getUserApplicationSettings(user.accountId))?.caUnit
  const caUnit = userCAUnit ? CA_UNIT_VALUES[userCAUnit] : defaultCAUnit

  return (
    <>
      <Breadcrumbs
        current={tNav('edit')}
        links={[
          { label: tNav('home'), link: '/' },
          { label: organizationVersion.organization.name, link: `/organisations/${organizationVersion.id}` },
        ]}
      />
      <Block as="h1" title={t('editTitle')}>
        <EditOrganizationForm organizationVersion={organizationVersion} caUnit={caUnit} />
      </Block>
    </>
  )
}

export default EditOrganizationPage
