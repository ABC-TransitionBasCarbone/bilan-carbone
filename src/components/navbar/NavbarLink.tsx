'use client'

import { LinkProps, Link as MuiLink, useTheme } from '@mui/material'
import Link from 'next/link'

const NavbarLink = ({ ...props }: LinkProps) => {
  const theme = useTheme()
  return (
    <MuiLink
      component={Link}
      {...props}
      sx={{
        color: theme.custom.navbar.text.color,
        fontWeight: theme.custom.navbar.text.fontWeight,
        textDecoration: 'none',
        textTransform: 'uppercase',
        marginLeft: '0.125rem',
      }}
    />
  )
}

export default NavbarLink
