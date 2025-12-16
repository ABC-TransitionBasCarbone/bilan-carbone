import { customRich } from '@/i18n/customRich'
import { getEnvVar } from '@/lib/environment'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Block from '../base/Block'

interface Props {
  environment: Environment
}

const ForbiddenAccess = ({ environment }: Props) => {
  const t = useTranslations('formation.forbidden')
  const FAQLink = getEnvVar('FAQ_LINK', environment)

  return (
    <Block title={t('title')} as="h1">
      <div className="flex-col">
        <p className="mb1">
          {customRich(t, 'message', {
            abc: (children) => (
              <Link href="https://abc-transitionbascarbone.fr/" target="_blank" rel="noreferrer noopener">
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
