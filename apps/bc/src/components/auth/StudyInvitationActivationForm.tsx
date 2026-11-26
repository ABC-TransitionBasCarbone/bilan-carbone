'use client'
import { activateStudyInvitation } from '@/services/serverFunctions/auth'
import LoadingButton from '@abc-transitionbascarbone/common/components/base/LoadingButton'
import { useServerFunction } from '@abc-transitionbascarbone/common/components/hooks/useServerFunction'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { getEnvRoute } from '@abc-transitionbascarbone/common/utils/environments'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  token: string
  environment: Environment
}

const StudyInvitationActivationForm = ({ token, environment }: Props) => {
  const router = useRouter()
  const t = useTranslations('login.form')
  const [submitting, setSubmitting] = useState(false)
  const { callServerFunction } = useServerFunction()

  const activate = async () => {
    setSubmitting(true)
    await callServerFunction(() => activateStudyInvitation(token), {
      getSuccessMessage: () => t('validated'),
      getErrorMessage: () => t('resetError'),
      onSuccess: () => {
        setSubmitting(false)
        router.push(getEnvRoute('login', environment))
      },
      onError: () => {
        setSubmitting(false)
      },
    })
  }

  return (
    <div className="mt1">
      <p>{t('studyInvitationActivation')}</p>
      <LoadingButton fullWidth loading={submitting} onClick={activate}>
        {t('activateStudyInvitation')}
      </LoadingButton>
    </div>
  )
}

export default StudyInvitationActivationForm
