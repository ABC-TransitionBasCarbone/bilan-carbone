'use client'
import { UserSessionProps } from '@/components/hoc/withAuth'
import { hasAccessToEnvironment } from '@/utils/userAccounts'
import { Alert, List, ListItem, ListItemText, Typography } from '@mui/material'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './StudyHomeMessage.module.css'

const StudyHomeMessage = ({ user }: UserSessionProps) => {
  const isCut = useMemo(() => hasAccessToEnvironment(user, Environment.CUT), [user?.environment])

  const t = useTranslations('home.message')
  return isCut ? (
    <Alert color="info" className={styles.mb1}>
      <Typography className={styles.whiteSpaces}>{t('core')}</Typography>
      <List dense>
        <ListItem disablePadding>
          <ListItemText primary={t('0')} />
        </ListItem>
        <ListItem>
          <ListItemText primary={t('1')} />
        </ListItem>
        <ListItem>
          <ListItemText primary={t('2')} />
        </ListItem>
        <ListItem>
          <ListItemText primary={t('3')} />
        </ListItem>
      </List>
    </Alert>
  ) : null
}

export default StudyHomeMessage
