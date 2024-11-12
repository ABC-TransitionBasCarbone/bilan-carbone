import classNames from 'classnames'
import React, { ReactNode } from 'react'
import styles from './Block.module.css'
import LinkButton from './LinkButton'

interface Props {
  children?: ReactNode
  title?: string
  icon?: ReactNode
  as?: 'h1'
  id?: string
  link?: string
  linkLabel?: string
  linkDataTestId?: string
}

const Block = ({ children, link, linkLabel, title, icon, as, id, linkDataTestId, ...rest }: Props) => {
  const Title = as === 'h1' ? 'h1' : 'h2'
  const titleDiv = (
    <div className={classNames(styles.title, 'align-center')}>
      {icon && <div className={as === 'h1' ? styles.bigIcon : styles.icon}>{icon}</div>}
      <Title id={id}>{title}</Title>
    </div>
  )

  return (
    <div className={classNames('main-container', styles.block)} {...rest}>
      <div className={styles.content}>
        {link ? (
          <div className="align-center justify-between">
            {titleDiv}
            <LinkButton href={link} data-testid={linkDataTestId}>
              {linkLabel}
            </LinkButton>
          </div>
        ) : (
          title && titleDiv
        )}
        {children && <div className={classNames(styles.children, { [styles.withMargin]: title })}>{children}</div>}
      </div>
    </div>
  )
}

export default Block
