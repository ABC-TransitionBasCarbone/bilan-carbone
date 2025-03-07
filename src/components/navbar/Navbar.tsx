'use client'

import { isAdmin } from '@/services/permissions/user'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import SettingsIcon from '@mui/icons-material/Settings'
import { CRUserChecklist, Role, UserCheckedStep } from '@prisma/client'
import classNames from 'classnames'
import { User } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import ChecklistButton from '../checklist/ChecklistButton'
import styles from './Navbar.module.css'

interface Props {
  user: User
  isCR: boolean
  userChecklist: UserCheckedStep[]
}

const Navbar = ({ user, isCR, userChecklist }: Props) => {
  const t = useTranslations('navigation')
  const [showSubMenu, setShowSubMenu] = useState(false)

  const handleMouseEnter = () => setShowSubMenu(true)
  const handleMouseLeave = () => setShowSubMenu(false)

  const completedChecklist = useMemo(
    () => userChecklist.length === (isCR ? Object.keys(CRUserChecklist).length : 0),
    [userChecklist, isCR],
  )

  return (
    <nav className={classNames(styles.navbar, 'w100')}>
      <div className="main-container px-2 align-center justify-between grow h100">
        <div className={classNames(styles.navbarContainer, 'flex-cc')}>
          <Link href="/" aria-label={t('home')} title={t('home')}>
            <Image src="/logos/logo_BC_2025_blanc.png" width={200} height={48} alt="" className={styles.logo} />
          </Link>
          <Link className={styles.link} href="/facteurs-d-emission">
            <span className={styles.big}>{t('factors')}</span>
            <span className={styles.small}>{t('fe')}</span>
          </Link>
          {user.organizationId && (
            <div className="flex-col">
              <div
                className={classNames(styles.link, styles.notClickable)}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={() => setShowSubMenu(!showSubMenu)}
              >
                {t('organization')}
              </div>
              {showSubMenu && (
                <div
                  className={classNames(styles.subMenu, 'flex-cc')}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  {(isAdmin(user.role) || user.role === Role.GESTIONNAIRE) && (
                    <Link href={`/organisations/${user.organizationId}/modifier`} className={styles.link}>
                      {t('information')}
                    </Link>
                  )}
                  <Link href="/equipe" className={styles.link}>
                    {t('team')}
                  </Link>
                  <Link href="/organisations" className={styles.link}>
                    {t('organizations')}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
        <div className={classNames(styles.navbarContainer, 'flex-cc')}>
          {user.role === Role.SUPER_ADMIN && (
            <Link className={styles.link} href="/super-admin">
              {t('admin')}
            </Link>
          )}
          {!completedChecklist && <ChecklistButton isCR={isCR} userChecklist={userChecklist} />}
          <Link
            target="_blank"
            rel="noreferrer noopener"
            href={process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''}
            className={classNames(styles.link, 'align-center')}
            aria-label={t('help')}
          >
            <HelpOutlineIcon />
          </Link>
          <Link className={classNames(styles.link, 'align-center')} aria-label={t('settings')} href="/parametres">
            <SettingsIcon />
          </Link>
          <Link className={classNames(styles.link, 'align-center')} aria-label={t('profile')} href="/profil">
            <AccountCircleIcon />
          </Link>
          <Link
            className={classNames(styles.link, 'align-center')}
            aria-label={t('methodology')}
            target="_blank"
            rel="noreferrer noopener"
            href="https://www.bilancarbone-methode.com/"
          >
            <MenuBookIcon />
          </Link>
          <button
            className={classNames(styles.link, 'align-center')}
            title={t('logout')}
            aria-label={t('logout')}
            onClick={() => signOut()}
          >
            <PowerSettingsNewIcon />
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
