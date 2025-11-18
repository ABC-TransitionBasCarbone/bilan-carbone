import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Block from '../base/Block'

const FAQLink = process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''

const ForbiddenAccess = () => {
  const t = useTranslations('formation.forbidden')
  return (
    <Block title={t('title')} as="h1">
      <div className="flex-col">
        <p className="mb1">
          {t.rich('message', {
            link: (children) => (
              <Link href={FAQLink} target="_blank" rel="noreferrer noopener">
                {children}
              </Link>
            ),
          })}
        </p>
        <Link href="/">{t('backToHome')}</Link>
      </div>
    </Block>
  )
}

export default ForbiddenAccess
