import classNames from 'classnames'
import Link, { LinkProps } from 'next/link'
import { AnchorHTMLAttributes } from 'react'
import buttonStyles from './Button.module.css'
import styles from './LinkButton.module.css'

const LinkButton = ({ className, ...rest }: LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <Link className={classNames(buttonStyles.button, styles.link, className, 'align-center p-2')} {...rest} />
)

export default LinkButton
