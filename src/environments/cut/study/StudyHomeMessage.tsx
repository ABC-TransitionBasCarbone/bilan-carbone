'use client'
import { CUT, useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Alert, List, ListItem, ListItemText, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './StudyHomeMessage.module.css'

const StudyHomeMessage = () => {
  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === CUT, [environment])

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
