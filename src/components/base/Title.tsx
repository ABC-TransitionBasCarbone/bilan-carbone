import classNames from 'classnames'
import { ReactNode } from 'react'
import IconLabel from './IconLabel'
import styles from './Title.module.css'

export interface Props {
  title?: string | ReactNode
  icon?: ReactNode
  expIcon?: boolean
  iconPosition?: 'before' | 'after'
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  id?: string
  ['data-testid']?: string
  className?: string
  children?: ReactNode
}

const Title = ({
  title,
  icon,
  iconPosition,
  as,
  id,
  'data-testid': dataTestId,
  expIcon,
  className,
  children,
}: Props) => {
  const Title = as || 'h2'
  const iconDiv = icon ? (
    <div className={classNames(as === 'h1' ? styles.bigIcon : styles.icon, { [styles.exp]: expIcon })}>{icon}</div>
  ) : null

  return (
    <IconLabel icon={iconDiv} iconPosition={iconPosition} className={classNames(styles.title, 'grow', className)}>
      <Title id={id} data-testid={dataTestId} className="flex grow">
        {title}
      </Title>
      {children}
    </IconLabel>
  )
}

export default Title
