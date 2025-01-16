import { CircularProgress } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './Spinner.module.css'

const Spinner = () => {
  const t = useTranslations('spinner')
  return (
    <>
      <CircularProgress className={styles.spinner} aria-label={t('loading')} title={t('loading')} size="1rem" />
      <p className={styles.hidden} role="status">
        {t('loading')}
      </p>
    </>
  )
}

export default Spinner
