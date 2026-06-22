import withAuth, { UserSessionProps } from '@/components/hoc/withAuth'
import Navbar from '@/components/navbar/Navbar'
import { Box } from '@mui/material'
import classNames from 'classnames'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = async ({ children, user: account }: Props & UserSessionProps) => {
  return (
    <Box className={classNames('flex-col h100')}>
      <Box component="main" className={styles.content}>
        <Navbar user={account} />
        {children}
      </Box>
    </Box>
  )
}

export default withAuth(NavLayout)
