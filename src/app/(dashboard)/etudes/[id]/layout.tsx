import Navbar from '@/components/navbar/Navbar'
import classNames from 'classnames'
import styles from '../../styles.module.css'
import StudyNavbar from '@/components/studyNavbar/studyNavbar'

interface Props {
  children: React.ReactNode
}

const NavLayout = ({ children }: Props) => (
  <div className="flex-row">
    <StudyNavbar />
    <main>{children}</main>
  </div>
)

export default NavLayout
