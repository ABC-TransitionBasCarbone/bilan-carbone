import { Button, ButtonProps } from '@mui/material'
import Link from 'next/link'

interface LinkButtonProps extends ButtonProps {
  href?: string
}

const LinkButton = ({ href = '#', color = 'secondary', variant = 'outlined', ...props }: LinkButtonProps) => (
  <Button component={Link} href={href} variant={variant} color={color} {...props} />
)

export default LinkButton
