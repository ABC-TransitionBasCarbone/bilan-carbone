'use client'
import PublicContainer from '@abc-transitionbascarbone/components/src/base/PublicContainer'
import classNames from 'classnames'
import { ReactNode } from 'react'
import styles from './Public.module.css'

interface Props {
  children: ReactNode
}

const PublicPage = ({ children }: Props) => {
  return (
    <PublicContainer>
      <div className={classNames(styles.loginForm, 'grow flex-col')}>{children}</div>
    </PublicContainer>
  )
}

export default PublicPage
