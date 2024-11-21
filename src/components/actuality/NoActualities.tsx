import { useTranslations } from 'next-intl'

const NoActualities = () => {
  const t = useTranslations('actuality')
  return <p>{t('noItems')}</p>
}

export default NoActualities
