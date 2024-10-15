import styles from './styles.module.css'
import Navigation from './navigation'
import Settings from './settings'
import Study from './study'
import classNames from 'classnames'

const Navbar = () => {
  return (
    <nav className={classNames(styles.navbar, 'px-2 align-center justify-between')}>
      <Navigation />
      <Study />
      <Settings />
    </nav>
  )
}

export default Navbar
