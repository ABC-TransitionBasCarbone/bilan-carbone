'use client'

import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import InputFileUpload from '../base/InputFileUpload'

const SuperAdminPage = () => {
  const t = useTranslations('admin')

  return (
    <Block title={t('title')} as="h1">
      <InputFileUpload label={t('uploadButton')} />
    </Block>
  )
}

export default SuperAdminPage
