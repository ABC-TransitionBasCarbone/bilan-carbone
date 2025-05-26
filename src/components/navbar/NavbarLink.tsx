'use client'

import { LinkProps, Link as MuiLink, styled } from '@mui/material'

const StyledNavbarLink = styled(MuiLink)(({ theme }) => ({
  color: theme.custom.navbar.text.color,
  fontWeight: theme.custom.navbar.text.fontWeight,
  textDecoration: 'none',
  textTransform: 'uppercase',
  marginLeft: '0.125rem',
}))

const NavbarLink = (props: LinkProps) => {
  return <StyledNavbarLink {...props} />
}

export default NavbarLink
