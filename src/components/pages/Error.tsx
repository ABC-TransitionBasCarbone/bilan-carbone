'use client'

import Block from '@/components/base/Block'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const Error = () => {
  const t = useTranslations('error')
  return (
    <Block title={t('error')} as="h1">
      <div>
        {t('try')} <Link href="/">{t('homePage')}</Link>.
      </div>
      <div>
        {t('contactSupport')}
        <Link href="mailto:support@abc-transitionbascarbone.fr">support@abc-transitionbascarbone.fr</Link>
      </div>
    </Block>
  )
}

export default Error
