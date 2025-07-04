import { ButtonProps, CircularProgress } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Button from './Button'
import styles from './LoadingButton.module.css'

export interface Props {
  children: React.ReactNode
  loading: boolean
  iconButton?: boolean
  fullWidth?: boolean
}

const LoadingButton = ({ children, loading, disabled, iconButton, fullWidth, ...rest }: Props & ButtonProps) => {
  const t = useTranslations('spinner')
  return (
    <Button
      disabled={disabled || loading}
      className={!fullWidth ? styles.buttonFitContent : undefined}
      fullWidth={fullWidth}
      {...rest}
    >
      {(!loading || !iconButton) && <>{children}</>}
      {loading && (
        <>
          <CircularProgress className={classNames(styles.spinner, { 'ml-2': !iconButton })} size="1rem" />
          <p className={styles.hidden} role="status">
            {t('loading')}
          </p>
        </>
      )}
    </Button>
  )
}

export default LoadingButton
