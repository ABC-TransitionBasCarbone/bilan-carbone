'use client'
import { CUT, useAppEnvironmentStore } from '@/store/AppEnvironment'
import { Alert, List, ListItem, ListItemText, Typography } from '@mui/material'
import { useMemo } from 'react'
import styles from './StudyHomeMessage.module.css'
import { useTranslations } from 'next-intl'

const StudyHomeMessage = () => {
  const { environment } = useAppEnvironmentStore()
  const isCut = useMemo(() => environment === CUT, [environment])

  if (!isCut) {
    return null;
  }

  const t = useTranslations('home.message');
  return (
    isCut && (
      <Alert color="info" className={styles.mb1}>
        <Typography className={styles.whiteSpaces}>
          {t('core')}
        </Typography>
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
    )
  )
}

export default StudyHomeMessage
