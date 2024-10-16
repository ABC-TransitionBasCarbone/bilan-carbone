import { AnchorHTMLAttributes } from 'react'
import Link, { LinkProps } from 'next/link'
import classNames from 'classnames'
import styles from './LinkButton.module.css'

const LinkButton = ({ className, ...rest }: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <Link className={classNames(styles.link, className, 'align-center p-2')} {...rest} />
)

export default LinkButton
