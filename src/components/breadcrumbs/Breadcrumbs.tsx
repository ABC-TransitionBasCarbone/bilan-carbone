import React from 'react'
import styles from './Breadcrumbs.module.css'
import Link from '../base/Link'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import classNames from 'classnames'

const Breadcrumbs = ({ links, current }: { links: { label: string; link: string }[]; current: string }) => {
  return (
    <nav role="navigation" aria-label="Breadcrumb" className="main-container">
      <ol className={classNames(styles.container, 'flex-cc')}>
        {links.map(({ label, link }) => (
          <li key={label} className={styles.li}>
            <Link className={styles.link} href={link}>
              {label}
            </Link>
            <KeyboardArrowRightIcon />
          </li>
        ))}
        <li className={styles.current} aria-current="page">
          {current}
        </li>
      </ol>
    </nav>
  )
}

export default Breadcrumbs
