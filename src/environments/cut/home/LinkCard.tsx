'use client'
import { Box, Link as MUILink, Typography } from '@mui/material'
import classNames from 'classnames'
import { ReactNode } from 'react'
import styles from './UserView.module.css'

interface LinkCardProps {
  href: string
  icon: ReactNode
  title: string
  message: string
}

const LinkCard = ({ href, icon, title, message }: LinkCardProps) => {
  return (
    <MUILink
      href={href}
      className={classNames('flex-col', 'flex-cc', 'gapped1', 'p1', styles.styledBoxContainer, styles.styledBoxLink)}
    >
      {icon}
      <Box>
        <Typography>{title}</Typography>
        <Typography variant="subtitle2" className={styles.linkMessage}>
          {message}
        </Typography>
      </Box>
    </MUILink>
  )
}

export default LinkCard
