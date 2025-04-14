'use client'

import { processUsers } from '@/scripts/ftp/userImport'
import { useTranslations } from 'next-intl'
import InputFileUpload from '../base/InputFileUpload'

const SuperAdminImport = () => {
  const t = useTranslations('admin')

  const onChange = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          try {
            const results = JSON.parse(event.target.result) as Record<string, string>[]
            processUsers(results, new Date())
          } catch (error) {
            console.error('Error parsing JSON:', error)
          }
        }
      }
      reader.readAsText(file)
    })
  }

  return <InputFileUpload label={t('uploadButton')} onChange={onChange} />
}

export default SuperAdminImport
