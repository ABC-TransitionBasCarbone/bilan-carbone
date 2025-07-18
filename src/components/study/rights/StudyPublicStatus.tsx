'use client'

import HelpIcon from '@/components/base/HelpIcon'
import { FormRadio } from '@/components/form/Radio'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { changeStudyPublicStatus } from '@/services/serverFunctions/study'
import {
  ChangeStudyPublicStatusCommand,
  ChangeStudyPublicStatusCommandValidation,
} from '@/services/serverFunctions/study.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormControlLabel, Radio } from '@mui/material'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  user: UserSession
  study: FullStudy
  disabled: boolean
}

const StudyPublicStatus = ({ study, disabled }: Props) => {
  const tForm = useTranslations('study.new')
  const tGlossary = useTranslations('study.new.glossary')
  const [glossary, setGlossary] = useState('')
  const { callServerFunction } = useServerFunction()
  const router = useRouter()

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

  const onSubmit = useCallback(
    async (command: ChangeStudyPublicStatusCommand) => {
      await callServerFunction(() => changeStudyPublicStatus(command), {
        onSuccess: () => {
          router.refresh()
        },
      })
    },
    [callServerFunction, router],
  )

  useEffect(() => {
    if (isPublic !== study.isPublic.toString()) {
      onSubmit(form.getValues())
    }
  }, [isPublic, study.isPublic, form])

  return (
    <div className="grow">
      <FormRadio
        control={form.control}
        translation={tForm}
        name="isPublic"
        row
        label={tForm('isPublicTitle')}
        icon={<HelpIcon onClick={() => setGlossary('visibility')} label={tGlossary('title')} />}
        iconPosition="after"
      >
        <FormControlLabel value="true" control={<Radio />} label={tForm('public')} disabled={disabled} />
        <FormControlLabel value="false" control={<Radio />} label={tForm('private')} disabled={disabled} />
      </FormRadio>
      <GlossaryModal label="study-status" glossary={glossary} onClose={() => setGlossary('')} t={tGlossary}>
        <span>{tGlossary('visibilityDescription')}</span>
      </GlossaryModal>
    </div>
  )
}
export default StudyPublicStatus
