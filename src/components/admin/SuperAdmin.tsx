'use client'

import { processUsers } from '@/scripts/ftp/userImport'
import { sendAuthorizationEmailUsers } from '@/services/serverFunctions/user'
import { useTranslations } from 'next-intl'
import { v4 as uuidv4 } from 'uuid'
import InputFileUpload from '../base/InputFileUpload'

const SuperAdmin = () => {
  const t = useTranslations('admin')

  const onChange = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = async (event) => {
        if (typeof event.target?.result === 'string') {
          try {
            const results = JSON.parse(event.target.result) as Record<string, string>[]
            const uuid = uuidv4()
            await sendAuthorizationEmailUsers(results, uuid)

            const userUuid = prompt('Veuillez entrer l\'UUID :')
            if (userUuid !== uuid) {
              console.error('Non-concordance des UUID. Processus annulé.')
              return
            }
            processUsers(results, new Date())
          } catch (error) {
            console.error('Erreur lors de l\'analyse du JSON :', error)
          }
        }
      }
      reader.readAsText(file)
    })
  }

  return <InputFileUpload label={t('uploadButton')} onChange={onChange} />
}

export default SuperAdmin
