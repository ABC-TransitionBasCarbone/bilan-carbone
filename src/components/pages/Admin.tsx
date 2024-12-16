'use client'

import { useTranslations } from 'next-intl'
import { useRef } from 'react'
import Block from '../base/Block'
import Button from '../base/Button'

const AdminPage = () => {
  const t = useTranslations('admin')
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <Block title={t('title')} as="h1">
      <input type="file" accept=".csv" ref={fileInputRef} style={{ display: 'none' }} />
      <Button onClick={() => fileInputRef.current?.click()} data-testid="upload-button" type="submit">
        {t('uploadButton')}
      </Button>
    </Block>
  )
}

export default AdminPage
