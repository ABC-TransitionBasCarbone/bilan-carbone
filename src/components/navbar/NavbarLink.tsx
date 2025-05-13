'use client'

import { styled, Link as MuiLink, LinkProps } from '@mui/material'

const StyledNavbarLink = styled(MuiLink)(({ theme }) => ({
    color: theme.custom.navbar.text.color,
    fontWeight: theme.custom.navbar.text.fontWeight,
    textDecoration: 'none',
    textTransform: 'uppercase'
}))

const NavbarLink = (props: LinkProps) => {
    return <StyledNavbarLink {...props} />
}

export default NavbarLink