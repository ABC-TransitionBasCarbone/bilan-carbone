'use client'

import LoginFormCommon from '@abc-transitionbascarbone/common/components/auth/LoginFormCommon'
import { useTranslations } from 'next-intl'

const LoginForm = () => {
  'use memo'

  const t = useTranslations('login.form')

  const getResetLink = (email: string) => `/reset-password?email=${email}`
  const getActivationLink = () => ''

  return (
    <LoginFormCommon
      errorMessageCustom={() => t('error')}
      getResetLink={getResetLink}
      getActivationLink={getActivationLink}
      t={t}
    />
  )
}

export default LoginForm
