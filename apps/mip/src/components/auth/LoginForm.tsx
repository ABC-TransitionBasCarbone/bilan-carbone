'use client'

import LoginFormCommon from '@abc-transitionbascarbone/components/src/auth/LoginFormCommon'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { useTranslations } from 'next-intl'

interface Props {
  environment?: Environment
}

const LoginForm = ({ environment = Environment.BC }: Props) => {
  'use memo'

  const support = ''
  const t = useTranslations('login.form')

  const getResetLink = (email: string) => ''
  const getActivationLink = (email: string) => ''

  return (
    <LoginFormCommon
      errorMessageCustom={(error) => ''}
      getResetLink={getResetLink}
      getActivationLink={getActivationLink}
      t={t}
    />
  )
}

export default LoginForm
