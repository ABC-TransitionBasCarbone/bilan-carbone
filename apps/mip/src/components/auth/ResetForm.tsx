'use client'
import { checkToken, reset } from '@/services/serverFunctions/auth'
import ResetFormCommon from '@abc-transitionbascarbone/components/src/auth/ResetFormCommon'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import ResetLinkAlreadyUsed from '@abc-transitionbascarbone/components/src/pages/ResetLinkAlreadyUsed'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { UserSession } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Props {
  user?: UserSession
  token: string
  environment?: Environment
}

const ResetForm = ({ user, token }: Props) => {
  useEffect(() => {
    if (user) {
      signOut({ callbackUrl: `/signed-out`, redirect: false })
    }
  }, [user])

  const router = useRouter()
  const t = useTranslations('login.form')
  const [invalidResetLink, setInvalidResetLink] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { callServerFunction } = useServerFunction()

  useEffect(() => {
    checkToken(token).then((invalidtoken) => {
      setInvalidResetLink(invalidtoken)
    })
  }, [token])

  if (invalidResetLink) {
    return <ResetLinkAlreadyUsed />
  }

  const loginLink = '/login'

  const resetPassword = async (email: string, password: string, token: string) => {
    await callServerFunction(() => reset(email.toLowerCase(), password, token), {
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
