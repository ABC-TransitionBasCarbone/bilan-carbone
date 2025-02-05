'use client'
import { FullStudy } from '@/db/study'
import { createEmissionSource } from '@/services/serverFunctions/emissionSource'
import { TextField } from '@mui/material'
import { EmissionSourceCaracterisation, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { FocusEvent, KeyboardEvent, useCallback, useState } from 'react'
import styles from './NewEmissionSource.module.css'

interface Props {
  study: FullStudy
  subPost: SubPost
  caracterisations: EmissionSourceCaracterisation[]
  studySite: string
}

const NewEmissionSource = ({ study, subPost, caracterisations, studySite }: Props) => {
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
          studySiteId: studySite,
          caracterisation: caracterisations.length === 1 ? caracterisations[0] : undefined,
        })
        if (!result) {
          setValue('')
          router.refresh()
        }
        setSaving(false)
      }
    },
    [study, subPost, router, studySite],
  )
  return (
    <TextField
      data-testid="new-emission-source"
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
