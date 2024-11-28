import { ButtonProps } from '@mui/material'
import classNames from 'classnames'
import { LinkProps } from 'next/link'

import { AnchorHTMLAttributes, ReactNode } from 'react'
import styles from './Block.module.css'
import Button from './Button'
import LinkButton from './LinkButton'

interface Props {
  children?: ReactNode
  title?: string
  icon?: ReactNode
  iconPosition?: 'before' | 'after'
  as?: 'h1'
  id?: string
  description?: ReactNode
  actions?: (
    | (ButtonProps & { actionType: 'button' })
    // No idea why i have to add data-testid here :/
    | (LinkProps & AnchorHTMLAttributes<HTMLAnchorElement> & { actionType: 'link'; 'data-testid'?: string })
  )[]
}

const Block = ({ children, title, icon, iconPosition, as, id, description, actions, ...rest }: Props) => {
  const Title = as === 'h1' ? 'h1' : 'h2'
  const iconDiv = icon ? <div className={as === 'h1' ? styles.bigIcon : styles.icon}>{icon}</div> : null
  const titleDiv = (
    <div className={classNames(styles.title, 'align-center')}>
      {iconPosition === 'before' && iconDiv}
      <Title id={id}>{title}</Title>
      {iconPosition !== 'before' && iconDiv}
    </div>
  )

  return (
    <div className={classNames('main-container', styles.block)} {...rest}>
      <div className={styles.content}>
        {actions ? (
          <div className={classNames(styles.header, 'align-center justify-between')}>
            {titleDiv}
            <div className={classNames(styles.actions, 'flex')}>
              {actions.map(({ actionType, ...action }, index) =>
                actionType === 'button' ? (
                  <Button key={index} {...(action as ButtonProps)} />
                ) : (
                  <LinkButton key={index} {...(action as LinkProps & AnchorHTMLAttributes<HTMLAnchorElement>)} />
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
