'use client'

import { LinkProps, Link as MuiLink, styled } from '@mui/material'
import Link from 'next/link'

const StyledNavbarLink = styled(MuiLink)<LinkProps>(({ theme }) => ({
  fontFamily: theme.custom.navbar.text.fontFamily,
  color: theme.custom.navbar.text.color,
  fontWeight: theme.custom.navbar.text.fontWeight,
  textDecoration: 'none',
  textTransform: 'uppercase',
  marginLeft: '0.125rem',
  justifyContent: 'center',
  alignItems: 'center',
  minWidth: '64px',
  padding: '6px 8px',
  display: 'flex',
}))

const NavbarLink = ({ ...props }: LinkProps) => {
  return <StyledNavbarLink component={Link} {...props} />
}

export default NavbarLink
