import { OrganizationWithSites } from '@/db/user'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'
import EditOrganizationForm from '../organization/edit/EditOrganizationForm'

interface Props {
  organization: OrganizationWithSites
}

const EditOrganizationPage = ({ organization }: Props) => {
  const tNav = useTranslations('nav')
  const t = useTranslations('organization.form')

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
        <EditOrganizationForm organization={organization} />
      </Block>
    </>
  )
}

export default EditOrganizationPage
