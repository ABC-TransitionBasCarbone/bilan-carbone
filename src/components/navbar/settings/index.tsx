'use client'

import { useTranslations } from 'next-intl'
import styles from './styles.module.css'
import Link from '@/components/link'
import LocaleSelector from './LocaleSelector'
import LogoutIcon from '@mui/icons-material/Logout'
import UserIcon from '@mui/icons-material/Person'

const Settings = () => {
  const t = useTranslations('navigation')

  return (
    <div className={`${styles.navSettings} flex`}>
      <LocaleSelector />
      <Link title={t('help')} href="mailto:support@abc-transitionbascarbone.fr">
        <span>{t('help')}</span>
      </Link>
      <Link title={t('profile')} href="/profil">
        <UserIcon />
      </Link>
      <Link title={t('logout')} href="/logout">
        <LogoutIcon />
      </Link>
    </div>
  )
}

export default Settings
