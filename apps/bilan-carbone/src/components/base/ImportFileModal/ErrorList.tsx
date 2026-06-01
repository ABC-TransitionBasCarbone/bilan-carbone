import { ImportError } from '@/types/import.types'
import { Alert, AlertTitle, List, ListItem, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './ImportFileModal.module.css'

interface Props {
  errors: { lineNumber: number | null; items: ImportError[] }[]
  t: ReturnType<typeof useTranslations>
  tCommon: ReturnType<typeof useTranslations>
}

const ErrorList = ({ errors, t, tCommon }: Props) => (
  <div className={styles.errorAlert}>
    <Alert severity="error">
      <AlertTitle>{t('errorTitle')}</AlertTitle>
      <List dense className={styles.errorList}>
        {errors.map(({ lineNumber, items }) => (
          <ListItem key={lineNumber} disableGutters className="py025">
            <div>
              {lineNumber !== null && (
                <Typography variant="body2" fontWeight="medium">
                  {tCommon('label.line', { lineNumber })}
                </Typography>
              )}
              <List dense disablePadding>
                {items.map((msg, i) => (
                  <ListItem key={i} disableGutters className={lineNumber !== null ? 'pl15' : undefined}>
                    <Typography variant="body2">
                      {lineNumber !== null ? '• ' : ''}
                      {t(msg.key, msg.value !== undefined ? { value: msg.value } : undefined)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </div>
          </ListItem>
        ))}
      </List>
    </Alert>
  </div>
)

export default ErrorList
