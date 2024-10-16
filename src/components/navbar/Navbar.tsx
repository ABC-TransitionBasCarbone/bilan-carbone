import classNames from 'classnames'
import styles from './Navbar.module.css'
import Navigation from './Navigation'
import Settings from './Settings'
import Study from './Study'

const Navbar = () => {
  return (
    <nav className={classNames(styles.navbar, 'flex w100')}>
      <div className="px-2 align-center justify-between grow">
        <Navigation />
        <Study />
        <Settings />
      </div>
    </nav>
  )
}

export default Navbar
