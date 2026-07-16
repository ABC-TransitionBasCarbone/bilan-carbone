'use client'

import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { getEnvVarClient } from '@abc-transitionbascarbone/utils/environmentClient'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const Error = () => {
  const { environment } = useAppEnvironmentStore()
  const support = getEnvVarClient('SUPPORT_EMAIL', environment)

  const t = useTranslations('error')
  return (
    <Block title={t('error')} as="h1">
      {customRich(t, 'contactSupport', {
        p: (children) => <p>{children}</p>,
        link: (children) => <Link href="/">{children}</Link>,
        m: () => <Link href={`mailto:${support}`}>{support}</Link>,
        logout: (children) => <Link href={`/logout?env=${environment}`}>{children}</Link>,
      })}
    </Block>
  )
}

export default Error
