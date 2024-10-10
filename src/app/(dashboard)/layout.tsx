import styles from './styles.module.css'
import Navbar from '@/components/navbar'

const NavLayout = ({ children }: Props) => (
  <div className={styles.navLayout}>
    <Navbar />
    <div className={styles.content}>{children}</div>
  </div>
)

interface Props {
  children: React.ReactNode
}

export default NavLayout
