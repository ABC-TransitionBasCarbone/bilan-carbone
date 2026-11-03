import Block from '@abc-transitionbascarbone/common/components/base/Block'
import { useTranslations } from 'next-intl'
import { Environment } from '@abc-transitionbascarbone/common/db/enums'
import Link from 'next/link'
import { getEnvRoute } from '../../utils/environments'

type Props = {
  environment: Environment
}
const ResetLinkAlreadyUsed = ({ environment }: Props) => {
  const t = useTranslations('login.form')
  return (
    <Block title={t('expired')} as="h1">
      <div className="flex-col" data-testid="not-found-page">
        <Link href={getEnvRoute('login', environment)}>{t('backToHome')}</Link>
      </div>
    </Block>
  )
}

export default ResetLinkAlreadyUsed
