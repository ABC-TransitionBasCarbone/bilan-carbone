import classNames from 'classnames'
import React, { ReactNode } from 'react'
import styles from './Block.module.css'
import LinkButton from './LinkButton'

interface Props {
  children?: ReactNode
  title?: string
  as?: 'h1'
  id?: string
  link?: string
  linkLabel?: string
  linkDataTestId?: string
}

const Block = ({ children, link, linkLabel, title, as, id, linkDataTestId, ...rest }: Props) => {
  const Title = as === 'h1' ? 'h1' : 'h2'
  return (
    <div className={classNames('main-container', styles.block)} {...rest}>
      {link ? (
        <div className="align-center justify-between">
          <Title id={id}>{title}</Title>
          <LinkButton href={link} data-testid={linkDataTestId}>
            {linkLabel}
          </LinkButton>
        </div>
      ) : (
        title && <Title id={id}>{title}</Title>
      )}
      {children && <div className={classNames(styles.children, { [styles.withMargin]: title })}>{children}</div>}
    </div>
  )
}

export default Block
