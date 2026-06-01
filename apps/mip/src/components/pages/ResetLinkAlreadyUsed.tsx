import { useTranslations } from 'next-intl'
import Link from 'next/link'

const ResetLinkAlreadyUsed = () => {
  const t = useTranslations('login.form')
  return (
    <div>
      <h1>{t('expired')}</h1>
      <div className="flex-col" data-testid="not-found-page">
        <Link href="/">{t('backToHome')}</Link>
      </div>
    </div>
  )
}

export default ResetLinkAlreadyUsed
