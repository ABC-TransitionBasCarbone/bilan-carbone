'use client'

import Block from '@/components/base/Block'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

const Error = () => {
  const t = useTranslations('error')
  return (
    <Block title={t('error')} as="h1">
      {t.rich('contactSupport', {
        p: (children) => <p>{children}</p>,
        link: (children) => <Link href="/">{children}</Link>,
        m: () => <Link href={`mailto:${contactMail}`}>{contactMail}</Link>,
        logout: (children) => <Link href="/logout">{children}</Link>,
      })}
    </Block>
  )
}

export default Error
