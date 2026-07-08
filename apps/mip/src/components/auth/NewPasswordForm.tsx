'use client'

import { resetPassword } from '@/services/serverFunctions/user'
import NewPasswordFormCommon from '@abc-transitionbascarbone/components/src/auth/NewPasswordFormCommon'
import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

const NewPasswordForm = () => {
  const t = useTranslations('login.form')
  const { callServerFunction } = useServerFunction()
  const router = useRouter()

  const loginLink = '/login'

  const resetPasswordHandler = async (email: string) => {
    callServerFunction(() => resetPassword(email.toLowerCase()), {
      getSuccessMessage: () => t('emailSent'),
      getErrorMessage: (error) => t(error),
      onSuccess: () => {
        router.push(loginLink)
      },
    })
  }
  return <NewPasswordFormCommon resetPassword={resetPasswordHandler} />
}

export default NewPasswordForm
