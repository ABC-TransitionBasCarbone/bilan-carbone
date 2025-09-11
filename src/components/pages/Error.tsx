'use client'

import Block from '@/components/base/Block'
import { getEnvVar } from '@/lib/environment'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const Error = () => {
  const { environment } = useAppEnvironmentStore()
  const support = getEnvVar('SUPPORT_EMAIL', environment)

  const t = useTranslations('error')
  return (
    <Block title={t('error')} as="h1">
      {t.rich('contactSupport', {
        p: (children) => <p>{children}</p>,
        link: (children) => <Link href="/">{children}</Link>,
        m: () => <Link href={`mailto:${support}`}>{support}</Link>,
        logout: (children) => <Link href={`/logout?env=${environment}`}>{children}</Link>,
      })}
    </Block>
  )
}

export default Error
