import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Block from '../base/Block'

const NotFound = () => {
  const t = useTranslations('nav')
  return (
    <Block title={t('notFound')} as="h1">
      <div className="flex-col" data-testid="not-found-page">
        <Link href="/">{t('backToHome')}</Link>
      </div>
    </Block>
  )
}

export default NotFound
