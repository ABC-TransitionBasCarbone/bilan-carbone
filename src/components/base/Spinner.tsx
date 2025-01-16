import { CircularProgress } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './Spinner.module.css'

interface Props {
  size?: number
  theme?: 'light' | 'dark'
}

const Spinner = ({ size = 1, theme = 'light' }: Props) => {
  const t = useTranslations('spinner')
  return (
    <CircularProgress data-testid="spinner" aria-label={t('loading')} size={`${size}rem`} className={styles[theme]} />
  )
}

export default Spinner
