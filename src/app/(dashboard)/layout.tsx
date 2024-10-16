import Navbar from '@/components/navbar/Navbar'
import Providers from '@/services/providers/Providers'
import classNames from 'classnames'
import styles from './styles.module.css'

interface Props {
  children: React.ReactNode
}

const NavLayout = ({ children }: Props) => (
  <div className="flex-col h100">
    <Navbar />
    <main className={classNames(styles.content, 'p15 grow')}>
      <Providers>{children}</Providers>
    </main>
  </div>
)

export default NavLayout
