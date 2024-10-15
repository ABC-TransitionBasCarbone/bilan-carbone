import { HTMLAttributes } from 'react'
import classNames from 'classnames'
import styles from './styles.module.css'

interface Props extends HTMLAttributes<HTMLAnchorElement> {
  href: string
}

const LinkButton = ({ className, ...rest }: Props) => (
  <a className={classNames(styles.link, className, 'align-center p-2')} {...rest} />
)

export default LinkButton
