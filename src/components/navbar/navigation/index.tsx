'use client'

import { useTranslations } from 'next-intl'
import styles from './styles.module.css'
import LinkButton from '@/components/linkButton'
import HomeIcon from '@mui/icons-material/Home'
import classNames from 'classnames'

const Navigation = () => {
  const t = useTranslations('navigation')

  return (
    <div className={classNames(styles.navRouter, 'flex')}>
      <LinkButton title={t('home')} href="/">
        <HomeIcon />
      </LinkButton>
      <LinkButton href="/facteurs">{t('factors')}</LinkButton>
      <LinkButton href="/equipe">{t('team')}</LinkButton>
    </div>
  )
}

export default Navigation
