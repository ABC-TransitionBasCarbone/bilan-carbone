import { customRich } from '@/i18n/customRich'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Block from '../base/Block'

interface Props {
  environment: Environment
}

const ForbiddenAccess = ({ environment }: Props) => {
  const t = useTranslations('formation.forbidden')

  return (
    <Block title={t('title')} as="h1">
      <div className="flex-col">
        <p className="mb1">{customRich(t, 'message', undefined, environment)}</p>
        <Link href="/">{t('backToHome')}</Link>
      </div>
    </Block>
  )
}

export default ForbiddenAccess
