import { Box } from '@mui/material'

interface Props {
  children: React.ReactNode
}

const PreviewLayout = async ({ children }: Props) => {
  return <Box className="h100">{children}</Box>
}

export default PreviewLayout
