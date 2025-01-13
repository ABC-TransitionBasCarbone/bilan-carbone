'use server'

import NewOrganizationForm from '@/components/organization/new/Form'
import { getTranslations } from 'next-intl/server'
import Breadcrumbs from '../breadcrumbs/Breadcrumbs'

const NewOrganizationPage = async () => {
  const tNav = await getTranslations('nav')

  return (
    <>
      <Breadcrumbs current={tNav('newOrganization')} links={[{ label: tNav('home'), link: '/' }]} />
      <NewOrganizationForm />
    </>
  )
}

export default NewOrganizationPage
