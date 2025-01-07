'use client'

import Block from '@/components/base/Block'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const Error = () => {
  const t = useTranslations('error')
  return (
    <Block title={t('error')} as="h1">
      {t.rich('contactSupport', {
        p: (children) => <p>{children}</p>,
        link: (children) => <Link href="/">{children}</Link>,
        m: (children) => <Link href="mailto:support@abc-transitionbascarbone.fr">{children}</Link>,
      })}
    </Block>
  )
}

export default Error
