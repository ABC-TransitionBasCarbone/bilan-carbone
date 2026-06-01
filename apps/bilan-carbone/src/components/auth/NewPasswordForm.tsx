'use client'

import { useServerFunction } from '@abc-transitionbascarbone/components/src/hooks/useServerFunction'
import { getEnvRoute } from '@/services/email/utils'
import { resetPassword } from '@/services/serverFunctions/user'
import NewPasswordFormCommon from '@abc-transitionbascarbone/components/src/auth/NewPasswordFormCommon'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Props {
  environment?: Environment
}

const NewPasswordForm = ({ environment = Environment.BC }: Props) => {
  const t = useTranslations('login.form')
  const { callServerFunction } = useServerFunction()
  const router = useRouter()

  const loginLink = getEnvRoute('login', environment)

  const resetPasswordHandler = async (email: string) => {
    callServerFunction(() => resetPassword(email.toLowerCase(), environment), {
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
