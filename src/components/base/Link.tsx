import { AnchorHTMLAttributes } from 'react'
import NextLink, { LinkProps } from 'next/link'
import classNames from 'classnames'
import styles from './Link.module.css'

const Link = ({ className, ...rest }: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <NextLink className={classNames(styles.link, className)} {...rest} />
)

export default Link
