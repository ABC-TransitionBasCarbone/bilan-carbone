import Button from '@/components/button'
import { useTranslations } from 'next-intl'

const Study = () => {
  const t = useTranslations('study')
  return <Button>{t('title')}</Button>
}

export default Study
