'use client'

import { Container, styled } from '@mui/material'
import classNames from 'classnames'
import { ReactNode } from 'react'
import styles from './PublicContainer.module.css'

interface Props {
  children: ReactNode
}

const StyledPublicContainer = styled(Container)(({ theme }) => ({
  background: theme.custom.publicContainer?.background,
}))

const PublicContainer = ({ children }: Props) => {
  return (
    <StyledPublicContainer className={classNames(styles.fullWidth, 'w100 h100 flex-cc')}>
      <div className={classNames(styles.container, 'mt1 mb1')}>
        <div className="flex">{children}</div>
      </div>
    </StyledPublicContainer>
  )
}

export default PublicContainer
