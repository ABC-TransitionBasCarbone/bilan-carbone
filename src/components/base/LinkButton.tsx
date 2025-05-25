import Link from 'next/link'
import { Button, ButtonProps } from '@mui/material'
import { forwardRef } from 'react'

interface LinkButtonProps extends ButtonProps {
  href: string
}

const LinkButton = ({ href, ...props }: LinkButtonProps) => (
  <Button component={Link} variant='outlined' href={href} {...props} />
)

export default LinkButton