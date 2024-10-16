import Button from '@/components/base/Button'
import { useTranslations } from 'next-intl'

const Study = () => {
  const t = useTranslations('study')
  return <Button>{t('title')}</Button>
}

export default Study
