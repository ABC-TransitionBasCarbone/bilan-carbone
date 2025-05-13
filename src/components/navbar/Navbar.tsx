'use client'

import { hasAccessToFormation } from '@/services/permissions/formations'
import { isAdmin } from '@/services/permissions/user'
import { CUT, useAppEnvironmentStore } from '@/store/AppEnvironment'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import { Role } from '@prisma/client'
import { User } from 'next-auth'
import { signOut } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { MouseEvent, useEffect, useMemo, useState } from 'react'
import { AppBar, Box, MenuItem, Toolbar } from '@mui/material'
import { Logo } from '../base/Logo'
import NavbarOrganizationMenu from './NavbarOrganizationMenu'
import NavbarLink from './NavbarLink'
import NavbarButton from './NavbarButton'
import styles from './Navbar.module.css'

interface Props {
  user: User
}

const Navbar = ({ user }: Props) => {
  const t = useTranslations('navigation')
  const [hasFormation, setHasFormation] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClickMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  useEffect(() => {
    const getFormationAccess = async () => {
      const hasAccess = await hasAccessToFormation(user)
      setHasFormation(hasAccess)
    }
    getFormationAccess()
  }, [user])

  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === CUT, [environment])

  return (
    <AppBar position="static">
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <NavbarLink href="/" aria-label={t('home')} title={t('home')}>
            <Logo />
          </NavbarLink>
          {user.organizationId && (
            <Box>
              <NavbarButton color="inherit" onMouseEnter={handleClickMenu}>
                {t('organization')}
              </NavbarButton>
              <NavbarOrganizationMenu
                id="navbar-organisation-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
              >
                {(isAdmin(user.role) || user.role === Role.GESTIONNAIRE) && (
                  <MenuItem onClick={handleClose}>
                    <NavbarLink href={`/organisations/${user.organizationId}/modifier`}>
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
          {hasFormation && !isCut && (
            <NavbarButton href="/formation">{t('formation')}</NavbarButton>
          )}
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <NavbarButton
            title={t('logout')}
            aria-label={t('logout')}
            onClick={() => signOut()}
          >
            <PowerSettingsNewIcon />
          </NavbarButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
