import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './Spinner.module.css'

interface Props {
  size?: number
  theme?: 'light' | 'dark'
}

const Spinner = ({ size = 2, theme = 'light' }: Props) => {
  const t = useTranslations('spinner')
  const spinnerStyle = {
    width: `${size}rem`,
    height: `${size}rem`,
    borderWidth: `${size / 8}rem`,
  }
  return (
    <div
      data-testid="spinner"
      className={classNames(styles.spinner, styles[theme])}
      style={spinnerStyle}
      aria-label={t('loading')}
      role="status"
    />
  )
}

export default Spinner
