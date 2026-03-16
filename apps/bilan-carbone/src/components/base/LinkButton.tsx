import { Button, ButtonProps } from '@mui/material'
import Link from 'next/link'
import { AnchorHTMLAttributes } from 'react'

type AnchorProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonProps>

type LinkButtonProps = ButtonProps & AnchorProps

const LinkButton = ({ href = '#', color = 'secondary', variant = 'outlined', ...props }: LinkButtonProps) => (
  <Button component={Link} href={href} variant={variant} color={color} {...props} />
)

export default LinkButton
