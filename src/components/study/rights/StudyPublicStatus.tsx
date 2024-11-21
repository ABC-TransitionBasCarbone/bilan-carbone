'use client'

import { FullStudy } from '@/db/study'
import { Role, StudyRole } from '@prisma/client'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import styles from './StudyPublicStatus.module.css'
import { FormRadio } from '@/components/form/Radio'
import { FormControlLabel, Radio } from '@mui/material'
import { useForm } from 'react-hook-form'
import {
  ChangeStudyPublicStatusCommand,
  ChangeStudyPublicStatusCommandValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { changeStudyPublicStatus } from '@/services/serverFunctions/study'
import { useEffect, useState } from 'react'

interface Props {
  user: User
  study: FullStudy
  userRoleOnStudy?: FullStudy['allowedUsers'][0]
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
    onSubmit(form.getValues())
  }, [isPublic])

  return (
    <div className="pb2">
      {user.role === Role.ADMIN || (userRoleOnStudy && userRoleOnStudy.role !== StudyRole.Reader) ? (
        <>
          <FormRadio control={form.control} translation={tForm} name="isPublic" row label={tForm('isPublicTitle')}>
            <FormControlLabel value="true" control={<Radio />} label={tForm('public')} />
            <FormControlLabel value="false" control={<Radio />} label={tForm('private')} />
          </FormRadio>
          {error && <p>{error}</p>}
        </>
      ) : (
        <p className={styles.text}>{t(study.isPublic ? 'isPublic' : 'isPrivate')}</p>
      )}
    </div>
  )
}

export default StudyPublicStatus
