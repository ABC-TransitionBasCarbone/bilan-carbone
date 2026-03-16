import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Block from '../base/Block'

const ResetLinkAlreadyUsed = () => {
  const t = useTranslations('login.form')
  return (
    <Block title={t('expired')} as="h1">
      <div className="flex-col" data-testid="not-found-page">
        <Link href="/">{t('backToHome')}</Link>
      </div>
    </Block>
  )
}

export default ResetLinkAlreadyUsed
