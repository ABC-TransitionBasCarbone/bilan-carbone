import { ImportError } from '@/types/import.types'
import { Alert, AlertTitle, List, ListItem, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './ImportFileModal.module.css'

interface Props {
  errors: { line: number; items: ImportError[] }[]
  t: ReturnType<typeof useTranslations>
  tCommon: ReturnType<typeof useTranslations>
}

const ErrorList = ({ errors, t, tCommon }: Props) => (
  <Alert severity="error">
    <AlertTitle>{t('errorTitle')}</AlertTitle>
    <List dense className={styles.errorList}>
      {errors.map(({ line, items }) => (
        <ListItem key={line} disableGutters className="py025">
          <div>
            {line > 0 && (
              <Typography variant="body2" fontWeight="medium">
                {tCommon('label.line', { line })}
              </Typography>
            )}
            <List dense disablePadding>
              {items.map((msg, i) => (
                <ListItem key={i} disableGutters className={line > 0 ? 'pl15' : undefined}>
                  <Typography variant="body2">
                    {line > 0 ? '• ' : ''}
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
)

export default ErrorList
