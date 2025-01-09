import withAuth, { UserProps } from '@/components/hoc/withAuth'
import Navbar from '@/components/navbar/Navbar'
import classNames from 'classnames'
import styles from './layout.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = async ({ children, user }: Props & UserProps) => {
  return (
    <div className="flex-col h100">
      <Navbar user={user} />
      <main className={classNames(styles.content)}>{children}</main>
    </div>
  )
}

export default withAuth(NavLayout)
