'use client'

import LoginFormCommon from '@abc-transitionbascarbone/common/components/auth/LoginFormCommon'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import { customRich } from '@abc-transitionbascarbone/common/utils/customRich'
import { getEnvVarClient } from '@abc-transitionbascarbone/common/utils/environmentClient'
import { getEnvRoute, isCourse } from '@abc-transitionbascarbone/common/utils/environments'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

interface Props {
  environment?: Environment
}

const LoginForm = ({ environment = Environment.BC }: Props) => {
  'use memo'

  const support = getEnvVarClient('SUPPORT_EMAIL', environment)
  const t = useTranslations('login.form')

  const getResetLink = (email: string) =>
    isCourse(environment) ? '' : getEnvRoute(`reset-password?email=${email}`, environment)
  const getActivationLink = (email: string) =>
    isCourse(environment)
      ? ''
      : getEnvRoute(
          environment === Environment.BC ? `activation?email=${email}` : `register?email=${email}`,
          environment,
        )

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
