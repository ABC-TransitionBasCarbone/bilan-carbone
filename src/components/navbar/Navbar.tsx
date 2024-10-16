import styles from './Navbar.module.css'
import Navigation from './Navigation'
import Settings from './Settings'
import Study from './Study'
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
