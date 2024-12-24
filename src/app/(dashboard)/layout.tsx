import Navbar from '@/components/navbar/Navbar'
import { auth } from '@/services/auth'
import classNames from 'classnames'
import styles from './styles.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = async ({ children }: Props) => {
  const session = await auth()

  if (!session) {
    return null
  }
  return (
    <div className="flex-col h100">
      <Navbar user={session.user} />
      <main className={classNames(styles.content)}>{children}</main>
    </div>
  )
}

export default NavLayout
