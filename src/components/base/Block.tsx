import classNames from 'classnames'
import React, { ReactNode } from 'react'
import styles from './Block.module.css'

interface Props {
  children?: ReactNode
  title?: string
  as?: 'h1'
  id?: string
}

const Block = ({ children, title, as, id, ...rest }: Props) => {
  const Title = as === 'h1' ? 'h1' : 'h2'
  return (
    <div className={classNames('main-container', styles.block)} {...rest}>
      {title && <Title id={id}>{title}</Title>}
      {children && <div className={classNames(styles.children, { [styles.withMargin]: title })}>{children}</div>}
    </div>
  )
}

export default Block
