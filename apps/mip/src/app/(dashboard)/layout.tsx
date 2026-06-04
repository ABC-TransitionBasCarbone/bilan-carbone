import Navbar from '@/components/navbar/Navbar'
import { Box } from '@mui/material'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
  user: UserSession
}

const NavLayout = async ({ children, user: account }: Props) => {
  return (
    <Box className={classNames('flex-col h100')}>
      <Box component="main" className={styles.content}>
        <Navbar user={account} />
        {children}
      </Box>
    </Box>
  )
}

export default NavLayout
// export default withAuth(NavLayout)
