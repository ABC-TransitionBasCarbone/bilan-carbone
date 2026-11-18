import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import Navbar from '@/components/navbar/Navbar'
import { getCurrentMessageBanners } from '@/services/serverFunctions/messageBanner'
import MessageBanners from '@abc-transitionbascarbone/common/components/MessageBanners'
import { Box } from '@mui/material'
import classNames from 'classnames'

interface Props {
  children: React.ReactNode
}

const NavLayout = async ({ children, user: account }: Props & UserSessionProps) => {
  const messageBanners = await getCurrentMessageBanners()
  if (!messageBanners.success) {
    console.error('NavLayout: failed to load message banners', { error: messageBanners.errorMessage })
  }

  return (
    <Box className={classNames('flex-col h100')}>
      <Box component="main" className={classNames('flex-col grow overflow-hidden')}>
        <Navbar user={account} />
        {messageBanners.success && <MessageBanners banners={messageBanners.data} />}
        {children}
      </Box>
    </Box>
  )
}

export default withAuth(NavLayout)
