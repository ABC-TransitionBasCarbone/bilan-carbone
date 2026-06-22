'use client'

import { signOutEnv } from '@abc-transitionbascarbone/services/auth/auth.utils'
import AppBar from '@abc-transitionbascarbone/ui/navbar/AppBar'
import NavbarButton from '@abc-transitionbascarbone/ui/navbar/NavbarButton'
import NavbarLink from '@abc-transitionbascarbone/ui/navbar/NavbarLink'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import { Box, Container, Toolbar } from '@mui/material'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'

interface Props {
  user: UserSession
}

const Navbar = ({ user }: Props) => {
  const t = useTranslations('navigation')

  return (
    <AppBar position="sticky" elevation={0}>
      <Toolbar variant="dense">
        <Container maxWidth="lg" className="justify-between">
          <Box className={classNames('flex-cc', 'gapped1')}>
            <NavbarLink href="/" aria-label={t('home')} title={t('home')}>
              Home
            </NavbarLink>
          </Box>
          <div className="flex gapped1">
            <Box>
              <div className="h100 align-center">
                <NavbarButton title={t('logout')} aria-label={t('logout')} onClick={() => signOutEnv()}>
                  <PowerSettingsNewIcon />
                </NavbarButton>
              </div>
            </Box>
          </div>
        </Container>
      </Toolbar>
    </AppBar>
  )
}

export default Navbar
