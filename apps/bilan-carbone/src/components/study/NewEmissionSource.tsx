'use client'
import type { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { createEmissionSource } from '@/services/serverFunctions/emissionSource'
import AddIcon from '@mui/icons-material/Add'
import { FormLabel, TextField } from '@mui/material'
import { EmissionSourceCaracterisation, SubPost } from '@repo/db-common'
import { Button } from '@repo/ui'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { KeyboardEvent, useCallback, useState } from 'react'
import styles from './NewEmissionSource.module.css'

interface Props {
  study: FullStudy
  subPost: SubPost
  caracterisations: EmissionSourceCaracterisation[]
  studySiteId: string
}

const NewEmissionSource = ({ study, subPost, caracterisations, studySiteId }: Props) => {
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const t = useTranslations('study.post')
  const { callServerFunction } = useServerFunction()
  const router = useRouter()

  const createSource = useCallback(
    async (rawName: string) => {
      const name = rawName.trim()
      if (!name || saving) {
        return
      }

      setSaving(true)
      await callServerFunction(
        () =>
          createEmissionSource({
            name,
            subPost,
            studyId: study.id,
            studySiteId,
            caracterisation: caracterisations.length === 1 ? caracterisations[0] : undefined,
          }),
        {
          onSuccess: () => {
            setValue('')
            // Keep the current subpost opened after refresh, otherwise newly created
            // sources can be hidden when the accordion remounts collapsed.
            window.location.hash = `subpost-${subPost}`
            router.refresh()
          },
        },
      )
      setSaving(false)
    },
    [study.id, subPost, studySiteId, caracterisations, callServerFunction, router, saving],
  )

  const onKeyDown = useCallback(
    async (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        await createSource((event.target as HTMLInputElement).value)
      }
    },
    [createSource],
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
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t('new')}
        />
        <div className="ml1">
          <Button
            className="h100"
            data-testid="new-emission-source-add"
            disabled={!value.trim() || saving}
            onClick={() => createSource(value)}
          >
            <AddIcon />
            {t('add')}
          </Button>
        </div>
      </div>
    </>
  )
}

export default NewEmissionSource
