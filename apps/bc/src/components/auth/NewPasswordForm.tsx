'use client'

import { resetPassword } from '@/services/serverFunctions/user'
import NewPasswordFormCommon from '@abc-transitionbascarbone/application/components/auth/NewPasswordFormCommon'
import { useServerFunction } from '@abc-transitionbascarbone/application/components/hooks/useServerFunction'
import { Environment } from '@abc-transitionbascarbone/db/enums'
import { getEnvRoute } from '@abc-transitionbascarbone/shared/utils/environments'
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
