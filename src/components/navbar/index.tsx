import styles from './styles.module.css'
import Navigation from './navigation'
import Settings from './settings'
import Study from './study'

const Navbar = () => {
  return (
    <div className={styles.navbar}>
      <Navigation />
      <Study />
      <Settings />
    </div>
  )
}

export default Navbar
