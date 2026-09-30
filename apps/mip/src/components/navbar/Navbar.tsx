'use client'

import { signOutEnv } from '@abc-transitionbascarbone/application/services/auth/auth.utils'
import AppBar from '@abc-transitionbascarbone/application/ui/navbar/AppBar'
import NavbarButton from '@abc-transitionbascarbone/application/ui/navbar/NavbarButton'
import NavbarLink from '@abc-transitionbascarbone/application/ui/navbar/NavbarLink'
import { RoleMip } from '@abc-transitionbascarbone/db/enums'
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew'
import { Box, Container, Toolbar } from '@mui/material'
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
          <NavbarLink href="/equipe" aria-label={t('team')}>
            {t('team')}
          </NavbarLink>
          <div className="flex gapped1">
            <Box>
              <div className="h100 align-center">
                {user.role !== RoleMip.SUPER_ADMIN && <NavbarLink href="/campaigns">{t('campaigns')}</NavbarLink>}
                {user.role === RoleMip.SUPER_ADMIN && <NavbarLink href="/super-admin">{t('admin')}</NavbarLink>}
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
