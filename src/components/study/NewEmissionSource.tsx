'use client'
import { TextField } from '@mui/material'
import React, { FocusEvent, KeyboardEvent, useCallback, useState } from 'react'
import styles from './NewEmissionSource.module.css'
import { useTranslations } from 'next-intl'
import { SubPost } from '@prisma/client'
import { FullStudy } from '@/db/study'
import { useRouter } from 'next/navigation'
import { createEmissionSource } from '@/services/serverFunctions/emissionSource'

interface Props {
  study: FullStudy
  subPost: SubPost
}

const NewEmissionSource = ({ study, subPost }: Props) => {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const t = useTranslations('study.post')
  const router = useRouter()

  const onKeyDown = useCallback((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const element = event.target as HTMLInputElement
      element.blur()
    }
  }, [])

  const onBlur = useCallback(
    async (event: FocusEvent<HTMLInputElement>) => {
      if (event.target.value) {
        setSaving(true)
        const result = await createEmissionSource({
          name: event.target.value,
          subPost,
          studyId: study.id,
        })
        if (!result) {
          setValue('')
          router.refresh()
        }
        setSaving(false)
      }
    },
    [study, subPost, router],
  )
  return (
    <TextField
      disabled={saving}
      className={styles.input}
      label={t('new')}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  )
}

export default NewEmissionSource
