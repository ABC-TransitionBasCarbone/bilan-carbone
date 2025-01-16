import { ButtonProps } from '@mui/material'
import Button from './Button'
import Spinner from './Spinner'

interface Props {
  children: React.ReactNode
  loading: boolean
}

const LoadingButton = ({ children, loading, ...rest }: Props & ButtonProps) => {
  return <Button {...rest}>{loading ? <Spinner /> : <>{children}</>}</Button>
}

export default LoadingButton
