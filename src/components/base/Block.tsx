import { Button, ButtonProps, Typography } from '@mui/material'
import classNames from 'classnames'
import { ReactNode } from 'react'
import styles from './Block.module.css'
import LinkButton from './LinkButton'
import LoadingButton, { Props as LoadingButtonProps } from './LoadingButton'
import Title from './Title'

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
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  id?: string
  ['data-testid']?: string
  description?: ReactNode
  actions?: Action[]
  className?: string
  bold?: boolean
  descriptionColor?: string
  fullSize?: boolean
  rightComponent?: ReactNode
  isMainContainer?: boolean
  grow?: boolean
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
  bold,
  descriptionColor,
  fullSize = true,
  rightComponent,
  isMainContainer = true,
  grow = false,
  ...rest
}: Props) => {
  const titleDiv = (
    <Title
      title={title}
      icon={icon}
      expIcon={expIcon}
      iconPosition={iconPosition}
      as={as}
      id={id}
      data-testid={dataTestId}
      grow={grow}
    />
  )

  return (
    <div className={classNames(isMainContainer ? 'main-container' : '', styles.block, { grow: fullSize })} {...rest}>
      <div className={classNames(styles.content, className)}>
        {actions || rightComponent ? (
          <div className={classNames(styles.header, 'align-center justify-between', bold && 'bold')}>
            {titleDiv}
            <div className={classNames(styles.actions, 'flex gapped1 align-center')}>
              {actions && (
                <div className={classNames(styles.actions, 'flex')}>
                  {actions.map(({ actionType, ...action }, index) =>
                    actionType === 'button' ? (
                      <Button key={index} variant="outlined" {...(action as ButtonProps)} />
                    ) : actionType === 'loadingButton' ? (
                      <LoadingButton key={index} {...(action as LoadingButtonProps)} />
                    ) : (
                      <LinkButton key={index} variant="contained" {...(action as ButtonProps & { href: string })} />
                    ),
                  )}
                </div>
              )}
              {rightComponent && <div className={'ml1'}>{rightComponent}</div>}
            </div>
          </div>
        ) : (
          title && titleDiv
        )}
        {description && (
          <Typography
            className={classNames(styles.description, bold && 'bold')}
            color={descriptionColor}
            component="div"
          >
            {description}
          </Typography>
        )}
        {children && <div className={classNames(styles.children, { [styles.withMargin]: title })}>{children}</div>}
      </div>
    </div>
  )
}

export default Block
