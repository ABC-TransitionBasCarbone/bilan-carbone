import Navbar from '@/components/navbar/Navbar'
import classNames from 'classnames'
import styles from './styles.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = ({ children }: Props) => (
  <div className="flex-col h100">
    <Navbar />
    <main className={classNames(styles.content)}>{children}</main>
  </div>
)

export default NavLayout
