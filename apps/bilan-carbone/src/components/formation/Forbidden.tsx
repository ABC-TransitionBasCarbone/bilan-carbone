import Block from '@abc-transitionbascarbone/components/src/base/Block'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { customRich } from '@abc-transitionbascarbone/utils/customRich'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

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
