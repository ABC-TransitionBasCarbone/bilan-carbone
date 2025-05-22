'use client'
import classNames from 'classnames'
import styles from './Box.module.css'
import { styled, Box as MuiBox, BoxProps, Palette, PaletteColor } from '@mui/material'
interface Props extends BoxProps {
  selected?: boolean,
  color?: keyof Palette
}

const StyledBox = styled(MuiBox, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<Props>(({ theme, selected, color = 'primary' }) => {
  const paletteColor = theme.palette[color] as PaletteColor
  return {
    ...theme.custom.box,
    borderColor: selected ? paletteColor.main : theme.palette.grey[300],
  }
})

const Box = ({ children, className, ...rest }: Props) => {
  return (
    <StyledBox className={classNames(styles.box, className)} {...rest}>
      {children}
    </StyledBox>
  )
}

export default Box
