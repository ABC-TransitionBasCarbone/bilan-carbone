import { useTranslations } from 'next-intl'
import Link from 'next/link'

const StudyNotFound = () => {
  const t = useTranslations('study')
  return (
    <div className="flex-col">
      <span>{t('not-found')}</span>
      <Link href="/">{t('back-to-home')}</Link>
    </div>
  )
}

export default StudyNotFound
