'use client'

import { styled, Button, ButtonProps } from '@mui/material'

const StyledNavbarButton = styled(Button)(({ theme }) => ({
    color: theme.custom.navbar.text.color,
    fontWeight: theme.custom.navbar.text.fontWeight,
    textTransform: theme.custom.navbar.text.textTransform,
    fontSize: theme.custom.navbar.text.fontSize
}))

const NavbarButton = (props: ButtonProps) => {
    return <StyledNavbarButton {...props} />
}

export default NavbarButton