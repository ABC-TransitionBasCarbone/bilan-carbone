import NavbarButton from '@/components/navbar/NavbarButton'
import NavbarLink from '@/components/navbar/NavbarLink'
import NavbarOrganizationMenu from '@/components/navbar/NavbarOrganizationMenu'
import { hasAccessToEmissionFactors } from '@/services/permissions/emissionFactor'
import { isAdmin } from '@/utils/user'
import { Box, MenuItem } from '@mui/material'
import { Role } from '@prisma/client'
import { UserSession } from 'next-auth'
import { useTranslations } from 'next-intl'
import { MouseEvent, useState } from 'react'
import styles from './Navbar.module.css'

interface Props {
  user: UserSession
  hasFormation: boolean
}

const OrganizationNavbar = ({ user, hasFormation }: Props) => {
  const t = useTranslations('navigation')
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClickMenu = (event: MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget)
  const handleClose = () => setAnchorEl(null)

  return (
    <>
      {user.organizationVersionId && (
        <Box>
          <NavbarButton data-testid="button-menu-my-organization" color="inherit" onMouseEnter={handleClickMenu}>
            {t('organization')}
          </NavbarButton>
          <NavbarOrganizationMenu
            id="navbar-organisation-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            slotProps={{ list: { onMouseLeave: handleClose } }}
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
            <MenuItem onClick={handleClose}>
              <NavbarLink data-testid="link-organization" href="/organisations" onClick={handleClose}>
                {t('organizations')}
              </NavbarLink>
            </MenuItem>
          </NavbarOrganizationMenu>
        </Box>
      )}
      {hasAccessToEmissionFactors(user.environment, user.level) && (
        <NavbarButton href="/facteurs-d-emission" data-testid="navbar-facteur-demission">
          <span className={styles.big}>{t('factors')}</span>
          <span className={styles.small}>{t('fe')}</span>
        </NavbarButton>
      )}

      {hasFormation && <NavbarButton href="/formation">{t('formation')}</NavbarButton>}
    </>
  )
}

export default OrganizationNavbar
