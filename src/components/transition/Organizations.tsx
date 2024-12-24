'use client'

import { maxAllowedFileSize, MB } from '@/services/file'
import { downloadOrganizations } from '@/services/serverFunctions/transitions'
import { Button } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './Organizations.module.css'

const OrganizationsTransition = () => {
  const t = useTranslations('transition')
  const tUpload = useTranslations('upload')
  const tError = useTranslations('error')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const download = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = event.target.files?.[0]
    if (!file) {
      setError(tUpload('noFileSelected'))
      return
    }
    if (file.size > maxAllowedFileSize) {
      setError(tUpload('fileTooBig', { size: maxAllowedFileSize / MB }))
      return
    }

    try {
      setLoading(true)
      const result = await downloadOrganizations(file)
      setLoading(false)
      if (result) {
        setError(result)
      } else {
        setSuccess(true)
      }
    } catch {
      setError(tError('default'))
    } finally {
      setLoading(false)
    }
  }
  return (
    <>
      <Button component="label" role={undefined} variant="contained" tabIndex={-1} disabled={loading || success}>
        {t('organizationsUpload')}
        <input type="file" className={styles.input} onChange={download} value="" accept=".xlsx" />
      </Button>
      {loading && <p className="mt1">{t('loading')}</p>}
      {success && <p className="mt1">{t('success')}</p>}
      {error && <p className={classNames(styles.error, 'mt1')}>{error}</p>}
    </>
  )
}

export default OrganizationsTransition
