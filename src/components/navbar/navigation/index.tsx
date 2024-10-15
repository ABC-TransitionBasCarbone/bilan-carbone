'use client'

import { useTranslations } from 'next-intl'
import styles from './styles.module.css'
import Link from '@/components/link'
import HomeIcon from '@mui/icons-material/Home'

const Navigation = () => {
  const t = useTranslations('navigation')

  return (
    <div className={styles.navRouter}>
      <Link title={t('home')} href="">
        <HomeIcon />
      </Link>
      <Link title={t('factors')} href="facteurs">
        <span>{t('factors')}</span>
      </Link>
      <Link title={t('team')} href="equipe">
        <span>{t('team')}</span>
      </Link>
    </div>
  )
}

export default Navigation
