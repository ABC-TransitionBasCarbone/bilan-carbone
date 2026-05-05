'use client'

import { customRich } from '@/i18n/customRich'
import { getEnvVarClient } from '@/lib/environmentClient'
import { getEnvRoute } from '@/services/email/utils'
import LoginFormCommon from '@repo/components/src/auth/LoginFormCommon'
import { Environment } from '@repo/db-common/enums'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface Props {
  environment?: Environment
}

const LoginForm = ({ environment = Environment.BC }: Props) => {
  const support = getEnvVarClient('SUPPORT_EMAIL', environment)
  const t = useTranslations('login.form')

  const getResetLink = (email: string) => getEnvRoute(`reset-password?email=${email}`, environment)
  const getActivationLink = (email: string) =>
    getEnvRoute(environment === Environment.BC ? `activation?email=${email}` : `register?email=${email}`, environment)

  return (
    <LoginFormCommon
      errorMessageCustom={(error) =>
        customRich(t, error, {
          link: (children) => <Link href={`mailto:${support}`}>{children}</Link>,
        })
      }
      getResetLink={getResetLink}
      getActivationLink={getActivationLink}
      t={t}
    />
  )
}

export default LoginForm
