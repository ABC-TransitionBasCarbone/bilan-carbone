import styles from './styles.module.css'
import Navbar from '@/components/navbar'

interface Props {
  children: React.ReactNode
}

const NavLayout = ({ children }: Props) => (
  <div className={styles.navLayout}>
    <Navbar />
    <div className={styles.content}>{children}</div>
  </div>
)

export default NavLayout
