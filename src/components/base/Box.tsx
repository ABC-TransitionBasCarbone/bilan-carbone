'use client'
import { BoxProps, Box as MuiBox, Palette, PaletteColor, styled } from '@mui/material'
import classNames from 'classnames'
import styles from './Box.module.css'
interface Props extends BoxProps {
  selected?: boolean
  color?: keyof Palette
}

const StyledBox = styled(MuiBox, {
  shouldForwardProp: (prop) => prop !== 'selected',
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
