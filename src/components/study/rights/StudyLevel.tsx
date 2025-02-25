'use client'

import { FormSelect } from '@/components/form/Select'
import { FullStudy } from '@/db/study'
import { changeStudyLevel } from '@/services/serverFunctions/study'
import { ChangeStudyLevelCommand, ChangeStudyLevelCommandValidation } from '@/services/serverFunctions/study.command'
import { getAllowedLevels } from '@/services/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { Level } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyPublicStatus.module.css'

interface Props {
  user: User
  study: FullStudy
  disabled: boolean
}

const StudyLevel = ({ user, study, disabled = false }: Props) => {
  const t = useTranslations('study.new')
  const tLevel = useTranslations('level')
  const [error, setError] = useState('')

  const form = useForm<ChangeStudyLevelCommand>({
    resolver: zodResolver(ChangeStudyLevelCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      level: study.level,
    },
  })

  const level = form.watch('level')

  const onSubmit = async (command: ChangeStudyLevelCommand) => {
    const result = await changeStudyLevel(command)
    if (result) {
      setError(result)
    }
  }

  useEffect(() => {
    if (level !== study.level) {
      onSubmit(form.getValues())
    }
  }, [level, form, study])

  const allowedLevels = useMemo(() => getAllowedLevels(user.level), [user])
  return (
    <div className="pb2">
      <>
        <FormSelect
          className={styles.select}
          control={form.control}
          translation={t}
          name="level"
          label={t('level')}
          data-testid="study-level"
          disabled={disabled}
        >
          {Object.values(Level).map((level) => (
            <MenuItem key={level} value={level} disabled={!allowedLevels.includes(level)}>
              {tLevel(level)}
            </MenuItem>
          ))}
        </FormSelect>
        {error && <p>{error}</p>}
      </>
    </div>
  )
}

export default StudyLevel
