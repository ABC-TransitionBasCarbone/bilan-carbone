'use client'

import { Button, ButtonProps, CSSProperties, styled } from '@mui/material'

const StyledNavbarButton = styled(Button)<ButtonProps>(({ theme }) => ({
  color: theme.custom.navbar.text.color,
  fontFamily: theme.custom.navbar.text.fontFamily,
  fontWeight: theme.custom.navbar.text.fontWeight,
  textTransform: theme.custom.navbar.text.textTransform as CSSProperties['textTransform'],
  fontSize: theme.custom.navbar.text.fontSize,
}))

const NavbarButton = (props: ButtonProps) => {
  return <StyledNavbarButton {...props} />
}

export default NavbarButton
