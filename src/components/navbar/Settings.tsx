'use client'

import { useTranslations } from 'next-intl'
import styles from './Settings.module.css'
import LinkButton from '@/components/base/LinkButton'
import LocaleSelector from './LocaleSelector'
import LogoutIcon from '@mui/icons-material/Logout'
import UserIcon from '@mui/icons-material/Person'
import classNames from 'classnames'

const supportMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

const Settings = () => {
  const t = useTranslations('navigation')

  return (
    <div className={classNames(styles.navSettings, 'flex')}>
      <LocaleSelector />
      <LinkButton href={`mailto:${supportMail}`}>
        <span>{t('help')}</span>
      </LinkButton>
      <LinkButton title={t('profile')} href="/profil">
        <UserIcon />
      </LinkButton>
      <LinkButton title={t('logout')} href="/logout">
        <LogoutIcon />
      </LinkButton>
    </div>
  )
}

export default Settings
