import { Button, ButtonProps } from '@mui/material'
import Link from 'next/link'

interface LinkButtonProps extends ButtonProps {
  href?: string
}

const LinkButton = ({ href = '#', ...props }: LinkButtonProps) => (
  <Button component={Link} href={href} variant="outlined" {...props} />
)

export default LinkButton
