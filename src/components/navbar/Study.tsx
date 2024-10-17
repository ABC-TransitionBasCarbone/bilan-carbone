import { useTranslations } from 'next-intl'
import Button from '../base/Button'

const Study = () => {
  const t = useTranslations('study')
  return <Button>{t('title')}</Button>
}

export default Study
