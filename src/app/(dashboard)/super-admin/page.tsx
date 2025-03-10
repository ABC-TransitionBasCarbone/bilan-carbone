'use server'

import Block from '@/components/base/Block'
import withAuth from '@/components/hoc/withAuth'
import SuperAdminPage from '@/components/pages/SuperAdmin'
import { useTranslations } from 'next-intl'

const SuperAdmin = () => {
  const t = useTranslations('admin')
  return (
    <Block title={t('title')} as="h1">
      <SuperAdminPage />
    </Block>
  )
}

export default withAuth(SuperAdmin)
