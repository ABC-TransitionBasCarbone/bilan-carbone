'use client'
import { signOutEnv } from '@/services/auth.utils'
import { getEnvRoute } from '@/services/email/utils'
import { checkToken, reset } from '@/services/serverFunctions/auth'
import ResetFormCommon from '@abc-transitionbascarbone/components/src/auth/ResetFormCommon'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ResetLinkAlreadyUsed from '../pages/ResetLinkAlreadyUsed'

interface Props {
  user?: UserSession
  token: string
  environment?: Environment
}

const ResetForm = ({ user, token, environment = Environment.BC }: Props) => {
  useEffect(() => {
    checkToken(token).then((invalidtoken) => {
      setInvalidResetLink(invalidtoken)
    })
  }, [token])

  useEffect(() => {
    if (user) {
      signOutEnv(environment, { redirect: false })
    }
  }, [user])

  const router = useRouter()
  const t = useTranslations('login.form')
  const [invalidResetLink, setInvalidResetLink] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { callServerFunction } = useServerFunction()

  if (invalidResetLink) {
    return <ResetLinkAlreadyUsed />
  }

  const loginLink = getEnvRoute('login', environment)

  const resetPassword = async (email: string, password: string, token: string) => {
    await callServerFunction(() => reset(email.toLowerCase(), password, token, environment), {
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

  return (
    <ResetFormCommon
      resetPassword={resetPassword}
      token={token}
      submitting={submitting}
      setSubmitting={setSubmitting}
    />
  )
}

export default ResetForm
