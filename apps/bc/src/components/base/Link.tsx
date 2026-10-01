import classNames from 'classnames'
import NextLink, { LinkProps } from 'next/link'
import { AnchorHTMLAttributes } from 'react'
import styles from './Link.module.css'

const Link = ({ className, ...rest }: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <NextLink className={classNames(styles.link, className)} {...rest} />
)

export default Link
