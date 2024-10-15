import { ReactNode } from 'react'
import classNames from 'classnames'
import styles from './styles.module.css'

interface Props extends React.HTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  className?: string
  href: string
}

const Link = ({ children, className, href, ...rest }: Props) => (
  <a href={href} className={classNames(styles.link, className, 'align-center p-2')} {...rest}>
    {children}
  </a>
)

export default Link
