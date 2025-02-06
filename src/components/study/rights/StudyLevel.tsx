'use client'

import { FormSelect } from '@/components/form/Select'
import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { changeStudyLevel } from '@/services/serverFunctions/study'
import { ChangeStudyLevelCommand, ChangeStudyLevelCommandValidation } from '@/services/serverFunctions/study.command'
import { getAllowedLevels } from '@/services/study'
import { zodResolver } from '@hookform/resolvers/zod'
import { MenuItem } from '@mui/material'
import { Level, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyPublicStatus.module.css'

interface Props {
  user: User
  study: FullStudy
  userRoleOnStudy?: StudyRole
}

const StudyLevel = ({ user, study, userRoleOnStudy }: Props) => {
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
      {isAdminOnStudyOrga(user, study) || userRoleOnStudy === StudyRole.Validator ? (
        <>
          <FormSelect
            className={styles.select}
            control={form.control}
            translation={t}
            name="level"
            label={t('level')}
            data-testid="study-level"
          >
            {Object.values(Level).map((level) => (
              <MenuItem key={level} value={level} disabled={!allowedLevels.includes(level)}>
                {tLevel(level)}
              </MenuItem>
            ))}
          </FormSelect>
          {error && <p>{error}</p>}
        </>
      ) : (
        <p className={styles.text}>
          {t('level')} : {tLevel(level)}
        </p>
      )}
    </div>
  )
}

export default StudyLevel
