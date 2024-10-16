import { useTranslations } from 'next-intl'
import LinkButton from '../base/LinkButton'

const Study = () => {
  const t = useTranslations('study')
  return <LinkButton href="/etudes">{t('title')}</LinkButton>
}

export default Study
