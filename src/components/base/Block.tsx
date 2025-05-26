import { Button, ButtonProps } from '@mui/material'
import classNames from 'classnames'

import { ReactNode } from 'react'
import styles from './Block.module.css'
import IconLabel from './IconLabel'
import LinkButton from './LinkButton'
import LoadingButton, { Props as LoadingButtonProps } from './LoadingButton'

export type Action =
  | (ButtonProps & { actionType: 'button'; 'data-testid'?: string })
  | (LoadingButtonProps & ButtonProps & { actionType: 'loadingButton' })
  | (ButtonProps & { actionType: 'link'; href?: string; 'data-testid'?: string })

export interface Props {
  children?: ReactNode
  title?: string | ReactNode
  icon?: ReactNode
  expIcon?: boolean
  iconPosition?: 'before' | 'after'
  as?: 'h1'
  id?: string
  ['data-testid']?: string
  description?: ReactNode
  actions?: Action[]
  className?: string
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
  actions,
  expIcon,
  className,
  ...rest
}: Props) => {
  const Title = as === 'h1' ? 'h1' : 'h2'
  const iconDiv = icon ? (
    <div className={classNames(as === 'h1' ? styles.bigIcon : styles.icon, { [styles.exp]: expIcon })}>{icon}</div>
  ) : null
  const titleDiv = (
    <IconLabel icon={iconDiv} iconPosition={iconPosition} className={styles.title}>
      <Title id={id} data-testid={dataTestId}>
        {title}
      </Title>
    </IconLabel>
  )

  return (
    <div className={classNames('main-container', styles.block)} {...rest}>
      <div className={classNames(styles.content, className)}>
        {actions ? (
          <div className={classNames(styles.header, 'align-center justify-between')}>
            {titleDiv}
            <div className={classNames(styles.actions, 'flex')}>
              {actions.map(({ actionType, ...action }, index) =>
                actionType === 'button' ? (
                  <Button key={index} {...(action as ButtonProps)} variant="outlined" />
                ) : actionType === 'loadingButton' ? (
                  <LoadingButton key={index} {...(action as LoadingButtonProps)} />
                ) : (
                  <LinkButton key={index} {...(action as ButtonProps & { href: string })} />
                ),
              )}
            </div>
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
