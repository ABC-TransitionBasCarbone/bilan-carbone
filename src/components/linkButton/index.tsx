import { ReactNode } from 'react'
import Link, { LinkProps } from 'next/link'
import classNames from 'classnames'
import styles from './styles.module.css'

interface Props extends LinkProps {
  children: ReactNode
  className?: string
  title?: string
}

const LinkButton = ({ className, ...rest }: Props) => (
  <Link className={classNames(styles.link, className, 'align-center p-2')} {...rest} />
)

export default LinkButton
