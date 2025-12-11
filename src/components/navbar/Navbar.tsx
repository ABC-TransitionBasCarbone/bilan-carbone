'use client'

import { hasAccessToFormation } from '@/services/permissions/formations'
import { getUserActiveAccounts } from '@/services/serverFunctions/user'
import { isAdmin } from '@/utils/user'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { AppBar, Box, Container, MenuItem, Toolbar } from '@mui/material'
import { Environment, Role } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { MouseEvent, ReactNode, useEffect, useMemo, useState } from 'react'
import { Logo } from '../base/Logo'
import styles from './Navbar.module.css'
import NavbarButton from './NavbarButton'
import NavbarLink from './NavbarLink'
import NavbarOrganizationMenu from './NavbarOrganizationMenu'

import { signOutEnv } from '@/services/auth'
import { hasAccessToStudies } from '@/services/permissions/study'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import SettingsIcon from '@mui/icons-material/Settings'
import classNames from 'classnames'

interface Props {
  children?: ReactNode
  user: UserSession
  environment: Environment
}

const Navbar = ({ children, user, environment }: Props) => {
  const t = useTranslations('navigation')
  const [hasFormation, setHasFormation] = useState(false)
  const [hasMultipleAccounts, setHasMultipleAccounts] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClickMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  useEffect(() => {
    const getFormationAccess = async () => {
      const hasAccess = await hasAccessToFormation(user.environment)
      setHasFormation(hasAccess)
    }

    const hasMultipleAccounts = async () => {
      const userAccounts = await getUserActiveAccounts()
      if (userAccounts.success) {
        setHasMultipleAccounts((userAccounts && userAccounts.data.length > 1) || false)
      }
    }

    hasMultipleAccounts()
    getFormationAccess()
  }, [user])

  const isCut = useMemo(() => user.environment === Environment.CUT, [user?.environment])
  const isTilt = useMemo(() => user.environment === Environment.TILT, [user?.environment])

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar variant="dense">
        <Container maxWidth="lg" className="justify-between">
          <Box className={classNames('flex-cc', 'gapped1')}>
            <NavbarLink href="/" aria-label={t('home')} title={t('home')}>
              <Logo environment={environment} />
            </NavbarLink>
            {isCut ? (
              <>
                {isAdmin(user.role) && (
                  <NavbarLink href={`/organisations/${user.organizationVersionId}/modifier`} className={styles.link}>
                    {t('information')}
                  </NavbarLink>
                )}
                <NavbarLink href="/equipe" className={styles.link}>
                  {t('team')}
                </NavbarLink>
                <NavbarLink href="/organisations" className={styles.link}>
                  {t('organizations')}
                </NavbarLink>
              </>
            ) : (
              <>
                {user.organizationVersionId && (
                  <Box>
                    <NavbarButton
                      data-testid="button-menu-my-organization"
                      color="inherit"
                      onMouseEnter={handleClickMenu}
                    >
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
                        <MenuItem>
                          <NavbarLink
                            data-testid="link-edit-organisation"
                            href={`/organisations/${user.organizationVersionId}/modifier`}
                            onClick={handleClose}
                          >
                            {t('information')}
                          </NavbarLink>
                        </MenuItem>
                      )}
                      <MenuItem>
                        <NavbarLink data-testid="link-equipe" href="/equipe" onClick={handleClose}>
                          {t('team')}
                        </NavbarLink>
                      </MenuItem>
                      {hasAccessToStudies(user.environment, user.level) && (
                        <MenuItem onClick={handleClose}>
                          <NavbarLink data-testid="link-organization" href="/organisations" onClick={handleClose}>
                            {t('organizations')}
                          </NavbarLink>
                        </MenuItem>
                      )}
                    </NavbarOrganizationMenu>
                  </Box>
                )}
                <NavbarButton href="/facteurs-d-emission" data-testid="navbar-facteur-demission">
                  <span className={styles.big}>{t('factors')}</span>
                  <span className={styles.small}>{t('fe')}</span>
                </NavbarButton>
                {hasFormation && <NavbarButton href="/formation">{t('formation')}</NavbarButton>}
              </>
            )}
          </Box>
          <div className="flex gapped1">
            <Box>
              {hasMultipleAccounts && (
                <NavbarButton aria-label={t('selectAccount')} href="/selection-du-compte">
                  <SwapHorizIcon />
                </NavbarButton>
              )}

              {user.role === Role.SUPER_ADMIN && <NavbarLink href="/super-admin">{t('admin')}</NavbarLink>}
              <NavbarButton rel="noreferrer noopener" href={'/ressources'} aria-label={t('help')}>
                <HelpOutlineIcon />
              </NavbarButton>
              {isCut && (
                <NavbarButton rel="noreferrer noopener" href={'/ressources'} aria-label={t('help')}>
                  <MenuBookIcon />
                </NavbarButton>
              )}
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
                  href={
                    isTilt
                      ? 'https://www.plancarbonegeneral.com/approches-sectorielles/sphere-associative'
                      : 'https://www.bilancarbone-methode.com/'
                  }
                >
                  <MenuBookIcon />
                </NavbarButton>
              )}
              <NavbarButton title={t('logout')} aria-label={t('logout')} onClick={() => signOutEnv(user.environment)}>
                <PowerSettingsNewIcon />
              </NavbarButton>
            </Box>
            {environment === Environment.TILT && (
              <NavbarLink href="/" aria-label={t('home')} title={t('home')}>
                <Logo />
              </NavbarLink>
            )}
          </div>
        </Container>
      </Toolbar>
      {children}
    </AppBar>
  )
}

export default Navbar
