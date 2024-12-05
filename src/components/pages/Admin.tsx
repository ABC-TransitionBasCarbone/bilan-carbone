'use client'

import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Block from '../base/Block'
import { ChangeEvent, useRef, useState } from 'react'
import { Alert, Button } from '@mui/material'

interface Props {
  user: User
}

const AdminPage = ({ user }: Props) => {
  const t = useTranslations('admin')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (file) {
      if (file.type !== 'text/csv') {
        return setError('csvOnly')
      }

      console.log(file.name)

      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        const rows = text.split('\n')
      }
      // "cp1252" is the encoding for Windows-1252 CSV files to match with UTF-8 javascript encoding
      reader.readAsText(file, "cp1252")
    }
  }


  return (
    <>
      <Block title={t('title')} as="h1">
        {error && <Alert className="mb1" severity="error">
          {t(error)}
        </Alert>}
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <Button onClick={() => fileInputRef.current?.click()} data-testid="upload-button" type="submit">
          {t('uploadButton')}
        </Button>
      </Block>
    </>
  )
}

export default AdminPage
