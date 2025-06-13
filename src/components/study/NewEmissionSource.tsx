'use client'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { createEmissionSource } from '@/services/serverFunctions/emissionSource'
import AddIcon from '@mui/icons-material/Add'
import { FormLabel, TextField } from '@mui/material'
import { EmissionSourceCaracterisation, SubPost } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { FocusEvent, KeyboardEvent, useCallback, useState } from 'react'
import Button from '../base/Button'
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
  const { callServerFunction } = useServerFunction()
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
        await callServerFunction(
          () =>
            createEmissionSource({
              name: event.target.value,
              subPost,
              studyId: study.id,
              studySiteId: studySite,
              caracterisation: caracterisations.length === 1 ? caracterisations[0] : undefined,
            }),
          {
            onSuccess: () => {
              setValue('')
              router.refresh()
            },
          },
        )
        setSaving(false)
      }
    },
    [study, subPost, router, studySite, callServerFunction, caracterisations],
  )
  return (
    <>
      <FormLabel component="legend">{t('label')}</FormLabel>
      <div className="flex">
        <TextField
          data-testid="new-emission-source"
          disabled={saving}
          className={styles.input}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('new')}
        />
        <div className="ml1">
          <Button className="h100" disabled={!value}>
            <AddIcon />
            {t('add')}
          </Button>
        </div>
      </div>
    </>
  )
}

export default NewEmissionSource
