'use client'

import { FormRadio } from '@/components/form/Radio'
import { FullStudy } from '@/db/study'
import { isAdminOnStudyOrga } from '@/services/permissions/study'
import { changeStudyPublicStatus } from '@/services/serverFunctions/study'
import {
  ChangeStudyPublicStatusCommand,
  ChangeStudyPublicStatusCommandValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControlLabel, Radio } from '@mui/material'
import { StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import styles from './StudyPublicStatus.module.css'

interface Props {
  user: User
  study: FullStudy
  userRoleOnStudy?: StudyRole
}

const StudyPublicStatus = ({ user, study, userRoleOnStudy }: Props) => {
  const t = useTranslations('study.rights')
  const tForm = useTranslations('study.new')
  const [error, setError] = useState('')

  const form = useForm<ChangeStudyPublicStatusCommand>({
    resolver: zodResolver(ChangeStudyPublicStatusCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      studyId: study.id,
      isPublic: study.isPublic.toString(),
    },
  })

  const isPublic = form.watch('isPublic')

  const onSubmit = async (command: ChangeStudyPublicStatusCommand) => {
    const result = await changeStudyPublicStatus(command)
    if (result) {
      setError(result)
    }
  }
  useEffect(() => {
    if (isPublic !== study.isPublic.toString()) {
      onSubmit(form.getValues())
    }
  }, [isPublic, study, form])

  return isAdminOnStudyOrga(user, study) || userRoleOnStudy !== StudyRole.Reader ? (
    <>
      <FormRadio control={form.control} translation={tForm} name="isPublic" row label={tForm('isPublicTitle')}>
        <FormControlLabel value="true" control={<Radio />} label={tForm('public')} />
        <FormControlLabel value="false" control={<Radio />} label={tForm('private')} />
      </FormRadio>
      {error && <p>{error}</p>}
    </>
  ) : (
    <p className={styles.text}>{t(study.isPublic ? 'isPublic' : 'isPrivate')}</p>
  )
}
export default StudyPublicStatus
