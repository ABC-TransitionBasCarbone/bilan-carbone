'use client'

import TopLeftNavBar from '@/components/navbar/TopLeftNavBar'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import CutTopLeftNavBar from '@/environments/cut/navbar/TopLeftNavBar'
import { Locale } from '@/i18n/config'
import { signOutEnv } from '@/services/auth.utils'
import { hasAccessToStudyComments, isClickson, isTilt } from '@/services/permissions/environment'
import { hasAccessToMethodology, hasAccessToSettings } from '@/services/permissions/environmentAdvanced'
import { hasAccessToFormation } from '@/services/permissions/formations'
import { getUserActiveAccounts } from '@/services/serverFunctions/user'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import SettingsIcon from '@mui/icons-material/Settings'
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'
import { Box, Container, Toolbar } from '@mui/material'
import { Environment, Role } from '@repo/db-common/enums'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useLocale, useTranslations } from 'next-intl'
import Image from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { Logo } from '../base/Logo'
import AppBar from './AppBar'
import NavbarButton from './NavbarButton'
import NavbarComments from './NavbarComments'
import NavbarLink from './NavbarLink'

interface Props {
  user: UserSession
  environment: Environment
  isFootprintsEnabled: boolean
  hasTrainedUsers: boolean
}

const Navbar = ({ user, environment, isFootprintsEnabled, hasTrainedUsers }: Props) => {
  const t = useTranslations('navigation')
  const [hasFormation, setHasFormation] = useState(false)
  const [hasMultipleAccounts, setHasMultipleAccounts] = useState(false)
  const locale = useLocale()

  useEffect(() => {
    const getFormationAccess = async () => {
      const hasAccess = await hasAccessToFormation(user)
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
        return locale === Locale.FR
          ? 'https://www.bilancarbone-methode.com/'
          : 'https://www.bilancarbone-methode.com/methode-bilan-carbone-r-en'
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
              defaultComponent={
                <TopLeftNavBar
                  user={user}
                  hasFormation={hasFormation}
                  isFootprintsEnabled={isFootprintsEnabled}
                  hasTrainedUsers={hasTrainedUsers}
                />
              }
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
                  <NavbarLink
                    aria-label={t('methodology')}
                    rel="noreferrer noopener"
                    target="_blank"
                    href={methodologyLink}
                  >
                    <MenuBookIcon />
                  </NavbarLink>
                )}
                {hasAccessToStudyComments(user.environment) && user.organizationVersionId && (
                  <NavbarButton title={t('comments')} aria-label={t('comments')} href={'/gestion-commentaires'}>
                    <NavbarComments organizationVersionId={user.organizationVersionId} />
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
            {isClickson(user.environment) && (
              <NavbarLink href="/" aria-label={t('home')} title={t('home')}>
                <div className="h100 align-center gapped1">
                  <Image src={'/logos/clickson/PEBC.png'} alt={'PEBC'} width={128} height={40} />
                </div>
              </NavbarLink>
            )}
          </div>
        </Container>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
