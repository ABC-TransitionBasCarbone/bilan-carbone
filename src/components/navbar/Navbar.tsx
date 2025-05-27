'use client'

import { hasAccessToFormation } from '@/services/permissions/formations'
import { getUserAccounts } from '@/services/serverFunctions/user'
import { isAdmin } from '@/utils/user'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { AppBar, Box, Container, MenuItem, Toolbar } from '@mui/material'
import { Environment, Role } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { MouseEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { Logo } from '../base/Logo'
import styles from './Navbar.module.css'
import NavbarButton from './NavbarButton'
import NavbarLink from './NavbarLink'
import NavbarOrganizationMenu from './NavbarOrganizationMenu'

import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SettingsIcon from '@mui/icons-material/Settings'

interface Props {
  user: UserSession
  children?: ReactNode
}

const Navbar = ({ children, user }: Props) => {
  const t = useTranslations('navigation')
  const [hasFormation, setHasFormation] = useState(false)
  const [hasMultipleAccounts, setHasMultipleAccounts] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClickMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  useEffect(() => {
    const getFormationAccess = async () => {
      const hasAccess = await hasAccessToFormation(user)
      setHasFormation(hasAccess)
    }

    const hasMultipleAccounts = async () => {
      const userAccounts = await getUserAccounts()
      if (userAccounts.success) {
        setHasMultipleAccounts((userAccounts && userAccounts.data.length > 1) || false)
      }
    }

    hasMultipleAccounts()
    getFormationAccess()
  }, [user])

  const isCut = useMemo(() => user.environment === Environment.CUT, [user?.environment])

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar variant="dense">
        <Container maxWidth="lg" className={styles.toolbarContainer}>
          <Box className={styles.buttonContainer}>
            <NavbarLink href="/" aria-label={t('home')} title={t('home')}>
              <Logo />
            </NavbarLink>
            {user.organizationVersionId && (
              <Box>
                <NavbarButton color="inherit" onMouseEnter={handleClickMenu}>
                  {t('organization')}
                </NavbarButton>
                <NavbarOrganizationMenu
                  id="navbar-organisation-menu"
                  anchorEl={anchorEl}
                  open={open}
                  onClose={handleClose}
                  slotProps={{
                    list: {
                      onMouseLeave: handleClose,
                    },
                  }}
                >
                  {(isAdmin(user.role) || user.role === Role.GESTIONNAIRE) && (
                    <MenuItem onClick={handleClose}>
                      <NavbarLink href={`/organisations/${user.organizationVersionId}/modifier`}>
                        {t('information')}
                      </NavbarLink>
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleClose}>
                    <NavbarLink href="/equipe">{t('team')}</NavbarLink>
                  </MenuItem>
                  <MenuItem onClick={handleClose}>
                    <NavbarLink href="/organisations">{t('organizations')}</NavbarLink>
                  </MenuItem>
                </NavbarOrganizationMenu>
              </Box>
            )}
            {!isCut && (
              <NavbarButton href="/facteurs-d-emission">
                <span className={styles.big}>{t('factors')}</span>
                <span className={styles.small}>{t('fe')}</span>
              </NavbarButton>
            )}
            {hasFormation && !isCut && <NavbarButton href="/formation">{t('formation')}</NavbarButton>}
          </Box>
          <Box className={styles.buttonContainer}>
            <NavbarButton
              rel="noreferrer noopener"
              href={process.env.NEXT_PUBLIC_ABC_FAQ_LINK || ''}
              aria-label={t('help')}
            >
              <HelpOutlineIcon />
            </NavbarButton>
            {!isCut && (
              <NavbarButton aria-label={t('settings')} href="/parametres">
                <SettingsIcon />
              </NavbarButton>
            )}
            <NavbarButton aria-label={t('profile')} href="/profil">
              <AccountCircleIcon />
            </NavbarButton>
            {!isCut && (
              <NavbarButton
                aria-label={t('methodology')}
                rel="noreferrer noopener"
                href="https://www.bilancarbone-methode.com/"
              >
                <MenuBookIcon />
              </NavbarButton>
            )}
            <NavbarButton title={t('logout')} aria-label={t('logout')} onClick={() => signOut()}>
              <PowerSettingsNewIcon />
            </NavbarButton>
          </Box>
        </Container>
      </Toolbar>
      {children}
    </AppBar>
  )
}

export default Navbar
