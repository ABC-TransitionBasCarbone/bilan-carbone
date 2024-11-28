import classNames from 'classnames'
import { ReactNode } from 'react'
import styles from './Block.module.css'

interface Props {
  children?: ReactNode
  title?: string
  icon?: ReactNode
  iconPosition?: 'before' | 'after'
  as?: 'h1'
  id?: string
  ['data-testid']?: string
  description?: ReactNode
  Buttons?: ReactNode
}

const Block = ({
  children,
  title,
  icon,
  iconPosition,
  as,
  id,
  'data-testid': dataTestId,
  description,
  Buttons,
  ...rest
}: Props) => {
  const Title = as === 'h1' ? 'h1' : 'h2'
  const iconDiv = icon ? <div className={as === 'h1' ? styles.bigIcon : styles.icon}>{icon}</div> : null
  const titleDiv = (
    <div className={classNames(styles.title, 'align-center')}>
      {iconPosition === 'before' && iconDiv}
      <Title id={id} data-testid={dataTestId}>
        {title}
      </Title>
      {iconPosition !== 'before' && iconDiv}
    </div>
  )

  return (
    <div className={classNames('main-container', styles.block)} {...rest}>
      <div className={styles.content}>
        {Buttons ? (
          <div className={classNames(styles.header, 'align-center justify-between')}>
            {titleDiv}
            {Buttons}
          </div>
        ) : (
          title && titleDiv
        )}
        {description && <div className={styles.description}>{description}</div>}
        {children && <div className={classNames(styles.children, { [styles.withMargin]: title })}>{children}</div>}
      </div>
    </div>
  )
}

export default Block
