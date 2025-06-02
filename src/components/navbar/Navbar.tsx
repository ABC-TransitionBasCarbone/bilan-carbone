'use client'

import { hasAccessToFormation } from '@/services/permissions/formations'
import { getUserAccounts } from '@/services/serverFunctions/user'
import { isAdmin } from '@/utils/user'
import { hasAccessToEnvironment } from '@/utils/userAccounts'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import SettingsIcon from '@mui/icons-material/Settings'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { Environment, Role } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import Image from '../document/Image'
import styles from './Navbar.module.css'

interface Props {
  user: UserSession
}

const Navbar = ({ user }: Props) => {
  const t = useTranslations('navigation')
  const [showSubMenu, setShowSubMenu] = useState(false)
  const [hasFormation, setHasFormation] = useState(false)
  const [hasMultipleAccounts, setHasMultipleAccounts] = useState(false)

  useEffect(() => {
    const getFormationAccess = async () => {
      const hasAccess = await hasAccessToFormation(user)
      setHasFormation(hasAccess)
    }

    const hasMultipleAccounts = async () => {
      const userAccounts = await getUserAccounts()
      setHasMultipleAccounts((userAccounts && userAccounts?.length > 1) || false)
    }

    hasMultipleAccounts()
    getFormationAccess()
  })

  const isCut = useMemo(() => hasAccessToEnvironment(user, Environment.CUT), [user?.environment])

  const handleMouseEnter = () => setShowSubMenu(true)
  const handleMouseLeave = () => setShowSubMenu(false)

  return (
    <nav className={classNames(styles.navbar, 'w100')}>
      <div className="main-container px-2 align-center justify-between grow h100">
        <div className={classNames(styles.navbarContainer, 'flex-cc')}>
          <Link href="/" aria-label={t('home')} title={t('home')}>
            <Image src="/logos/logo_BC_2025_blanc.png" width={200} height={48} alt="" className={styles.logo} />
          </Link>
          {user.organizationVersionId && (
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
                    <Link href={`/organisations/${user.organizationVersionId}/modifier`} className={styles.link}>
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
          {!isCut && (
            <Link className={styles.link} href="/facteurs-d-emission">
              <span className={styles.big}>{t('factors')}</span>
              <span className={styles.small}>{t('fe')}</span>
            </Link>
          )}
          {hasFormation && !isCut && (
            <Link className={styles.link} href="/formation">
              <span>{t('formation')}</span>
            </Link>
          )}
        </div>
        <div className={classNames(styles.navbarContainer, 'flex-cc')}>
          {hasMultipleAccounts && (
            <Link
              className={classNames(styles.link, 'align-center')}
              aria-label={t('selectAccount')}
              href="/selection-du-compte"
            >
              <SwapHorizIcon />
            </Link>
          )}

          {user.role === Role.SUPER_ADMIN && (
            <Link className={styles.link} href="/super-admin">
              {t('admin')}
            </Link>
          )}
          <Link
            target="_blank"
            rel="noreferrer noopener"
            href={process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''}
            className={classNames(styles.link, 'align-center')}
            aria-label={t('help')}
          >
            <HelpOutlineIcon />
          </Link>
          {!isCut && (
            <Link className={classNames(styles.link, 'align-center')} aria-label={t('settings')} href="/parametres">
              <SettingsIcon />
            </Link>
          )}
          <Link className={classNames(styles.link, 'align-center')} aria-label={t('profile')} href="/profil">
            <AccountCircleIcon />
          </Link>
          {!isCut && !user.organizationId && (
            <Link
              className={classNames(styles.link, 'align-center')}
              aria-label={t('methodology')}
              target="_blank"
              rel="noreferrer noopener"
              href="https://www.bilancarbone-methode.com/"
            >
              <MenuBookIcon />
            </Link>
          )}
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
