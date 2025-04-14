'use client'

import { sendAuthorizationEmailUsers, verifyPasswordAndProcessUsers } from '@/services/serverFunctions/user'
import { useTranslations } from 'next-intl'
import InputFileUpload from '../base/InputFileUpload'

const SuperAdminImport = () => {
  const t = useTranslations('admin')

  const onChange = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = async (event) => {
        if (typeof event.target?.result === 'string') {
          try {
            const userUuid = prompt("Veuillez entrer l'UUID :")
            if (!userUuid || (await verifyPasswordAndProcessUsers(userUuid))) {
              console.error('Non-concordance des UUID. Processus annulé.')
              return
            }

            const results = JSON.parse(event.target.result) as Record<string, string>[]
            await sendAuthorizationEmailUsers(results)
          } catch (error) {
            console.error("Erreur lors de l'analyse du JSON :", error)
          }
        }
      }
      reader.readAsText(file)
    })
  }

  return <InputFileUpload label={t('uploadButton')} onChange={onChange} />
}

export default SuperAdminImport
