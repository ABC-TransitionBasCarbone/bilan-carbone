import { ImportWarning } from '@/types/import.types'
import { Alert, AlertTitle, List, ListItem, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './ImportFileModal.module.css'
import WarningItem from './WarningItem'

interface Props {
  warnings: { lineNumber: number | null; items: ImportWarning[] }[]
  t: ReturnType<typeof useTranslations>
  tCommon: ReturnType<typeof useTranslations>
}

const WarningList = ({ warnings, t, tCommon }: Props) => (
  <div className={styles.errorAlert}>
    <Alert severity="warning">
      <AlertTitle>{t('warningTitle')}</AlertTitle>
      <List dense className={styles.errorList}>
        {warnings.map(({ lineNumber, items }) => (
          <ListItem key={lineNumber ?? 'global'} disableGutters className="py025">
            <div>
              <Typography variant="body2" fontWeight="medium">
                {lineNumber !== null ? tCommon('label.line', { lineNumber }) : ''}
                {items[0]?.sourceName ? ` — ${items[0].sourceName}` : ''}
              </Typography>

              <List dense disablePadding>
                {items.map((w, i) => (
                  <WarningItem key={i} w={w} lineNumber={lineNumber} t={t} />
                ))}
              </List>
            </div>
          </ListItem>
        ))}
      </List>
    </Alert>
  </div>
)

export default WarningList
