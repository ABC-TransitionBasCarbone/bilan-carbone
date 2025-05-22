'use client'
import classNames from 'classnames'
import styles from './Box.module.css'
import { styled, Box as MuiBox } from '@mui/material'

interface Props {
  children: React.ReactNode
  className?: string
}

const StyledBox = styled(MuiBox)(({ theme }) => ({
  ...theme.custom.box
}))

const Box = ({ children, className, ...rest }: Props) => {
  return (
    <StyledBox className={classNames(styles.box, className)} {...rest}>
      {children}
    </StyledBox>
  )
}

export default Box
