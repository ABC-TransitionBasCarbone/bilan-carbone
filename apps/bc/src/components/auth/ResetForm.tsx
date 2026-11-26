'use client'
import StudyInvitationActivationForm from '@/components/auth/StudyInvitationActivationForm'
import { checkStudyInvitationActivationToken, checkToken, reset } from '@/services/serverFunctions/auth'
import ResetFormCommon from '@abc-transitionbascarbone/common/components/auth/ResetFormCommon'
import { useServerFunction } from '@abc-transitionbascarbone/common/components/hooks/useServerFunction'
import ResetLinkAlreadyUsed from '@abc-transitionbascarbone/common/components/pages/ResetLinkAlreadyUsed'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { signOutEnv } from '@abc-transitionbascarbone/common/services/auth/auth.utils'
import { getEnvRoute } from '@abc-transitionbascarbone/common/utils/environments'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Props {
  user?: UserSession
  token: string
  environment?: Environment
}

const ResetForm = ({ user, token, environment = Environment.BC }: Props) => {
  useEffect(() => {
    let isCurrentToken = true
    setInvalidResetLink(undefined)
    setStudyInvitationActivation(false)

    Promise.all([checkToken(token), checkStudyInvitationActivationToken(token)]).then(
      ([invalidToken, isStudyInvitationActivation]) => {
        if (isCurrentToken) {
          setInvalidResetLink(invalidToken)
          setStudyInvitationActivation(isStudyInvitationActivation)
        }
      },
    )

    return () => {
      isCurrentToken = false
    }
  }, [token])

  useEffect(() => {
    if (user) {
      signOutEnv(environment, { redirect: false })
    }
  }, [user])

  const router = useRouter()
  const t = useTranslations('login.form')
  const [invalidResetLink, setInvalidResetLink] = useState<boolean>()
  const [studyInvitationActivation, setStudyInvitationActivation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { callServerFunction } = useServerFunction()

  if (invalidResetLink === undefined) {
    return null
  }

  if (invalidResetLink) {
    return <ResetLinkAlreadyUsed environment={environment} />
  }

  if (studyInvitationActivation) {
    return <StudyInvitationActivationForm token={token} environment={environment} />
  }

  const loginLink = getEnvRoute('login', environment)

  const resetPassword = async (password: string) => {
    await callServerFunction(() => reset(password, token, environment), {
      getSuccessMessage: () => t('validated'),
      getErrorMessage: () => t('resetError'),
      onSuccess: () => {
        setSubmitting(false)
        router.push(loginLink)
      },
      onError: () => {
        setSubmitting(false)
      },
    })
  }

  return <ResetFormCommon resetPassword={resetPassword} submitting={submitting} setSubmitting={setSubmitting} />
}

export default ResetForm
