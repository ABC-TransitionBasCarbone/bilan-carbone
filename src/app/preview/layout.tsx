import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import EnvironmentInitializer from '@/environments/core/EnvironmentInitializer'
import DynamicTheme from '@/environments/core/providers/DynamicTheme'
import { getEnvironment } from '@/i18n/environment'
import { Box } from '@mui/material'

interface Props {
  children: React.ReactNode
}

const PreviewLayout = async ({ children, user }: Props & UserSessionProps) => {
  const environment = await getEnvironment()

  return (
    <DynamicTheme environment={environment}>
      <Box className="h100">
        {children}
        <EnvironmentInitializer user={user} />
      </Box>
    </DynamicTheme>
  )
}

export default withAuth(PreviewLayout)
