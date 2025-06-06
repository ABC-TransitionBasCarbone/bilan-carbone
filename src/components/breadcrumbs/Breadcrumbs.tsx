import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import classNames from 'classnames'
import Link from '../base/Link'
import styles from './Breadcrumbs.module.css'

const Breadcrumbs = ({ links, current }: { links: { label: string; link: string }[]; current: string }) => {
  return (
    <nav role="navigation" aria-label="Breadcrumb" className={classNames(styles.navigation, 'main-container')}>
      <ol className={classNames(styles.container, 'flex-cc')}>
        {links.map(({ label, link }) => (
          <li key={label} className={classNames(styles.previousPage, 'flex-cc')}>
            <Link className={styles.link} href={link}>
              {label}
            </Link>
            <KeyboardArrowRightIcon className={styles.svg} />
          </li>
        ))}
        <li className={styles.currentPage} aria-current="page">
          {current}
        </li>
      </ol>
    </nav>
  )
}

export default Breadcrumbs
