'use client'

import TopLeftNavBar from '@/components/navbar/TopLeftNavBar'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import CutTopLeftNavBar from '@/environments/cut/navbar/TopLeftNavBar'
import { signOutEnv } from '@/services/auth'
import { isTilt } from '@/services/permissions/environment'
import { hasAccessToMethodology, hasAccessToSettings } from '@/services/permissions/environmentExtended'
import { hasAccessToFormation } from '@/services/permissions/formations'
import { getUserActiveAccounts } from '@/services/serverFunctions/user'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import SettingsIcon from '@mui/icons-material/Settings'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { AppBar, Box, Container, Toolbar } from '@mui/material'
import { Environment, Role } from '@prisma/client'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Logo } from '../base/Logo'
import NavbarButton from './NavbarButton'
import NavbarLink from './NavbarLink'

interface Props {
  children?: ReactNode
  user: UserSession
  environment: Environment
}

const Navbar = ({ children, user, environment }: Props) => {
  const t = useTranslations('navigation')
  const [hasFormation, setHasFormation] = useState(false)
  const [hasMultipleAccounts, setHasMultipleAccounts] = useState(false)

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

  const methodologyLink = useMemo(() => {
    switch (user.environment) {
      case Environment.TILT:
        return 'https://www.plancarbonegeneral.com/approches-sectorielles/sphere-associative'
      default:
        return 'https://www.bilancarbone-methode.com/'
    }
  }, [user.environment])

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar variant="dense">
        <Container maxWidth="lg" className="justify-between">
          <Box className={classNames('flex-cc', 'gapped1')}>
            <NavbarLink href="/" aria-label={t('home')} title={t('home')}>
              <Logo environment={environment} />
            </NavbarLink>
            <DynamicComponent
              environmentComponents={{
                [Environment.CUT]: <CutTopLeftNavBar user={user} />,
              }}
              defaultComponent={<TopLeftNavBar user={user} hasFormation={hasFormation} />}
            />
          </Box>
          <div className="flex gapped1">
            <Box>
              <div className="h100 align-center">
                {hasMultipleAccounts && (
                  <NavbarButton aria-label={t('selectAccount')} href="/selection-du-compte">
                    <SwapHorizIcon />
                  </NavbarButton>
                )}

                {user.role === Role.SUPER_ADMIN && <NavbarLink href="/super-admin">{t('admin')}</NavbarLink>}
                <NavbarButton rel="noreferrer noopener" href="/ressources" aria-label={t('help')}>
                  <HelpOutlineIcon />
                </NavbarButton>
                {hasAccessToSettings(user.environment, user.level) && (
                  <NavbarButton aria-label={t('settings')} href="/parametres">
                    <SettingsIcon />
                  </NavbarButton>
                )}
                <NavbarButton aria-label={t('profile')} href="/profil">
                  <AccountCircleIcon />
                </NavbarButton>
                {hasAccessToMethodology(user.environment, user.level) && (
                  <NavbarButton aria-label={t('methodology')} rel="noreferrer noopener" href={methodologyLink}>
                    <MenuBookIcon />
                  </NavbarButton>
                )}
                <NavbarButton title={t('logout')} aria-label={t('logout')} onClick={() => signOutEnv(user.environment)}>
                  <PowerSettingsNewIcon />
                </NavbarButton>
              </div>
            </Box>
            {isTilt(user.environment) && (
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
