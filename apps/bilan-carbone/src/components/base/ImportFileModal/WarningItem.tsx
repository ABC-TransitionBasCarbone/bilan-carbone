import { ImportWarning } from '@/types/import.types'
import { formatEf } from '@/utils/import.utils'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import { ListItem, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './ImportFileModal.module.css'

interface Props {
  w: ImportWarning
  lineNumber: number | null
  t: ReturnType<typeof useTranslations>
}

const WarningItem = ({ w, lineNumber, t }: Props) => {
  let warningMessage: string | null = null
  if (w.type === 'validationSkipped') {
    warningMessage = t('warningValidationSkipped')
  }
  if (w.type === 'efMissing') {
    warningMessage = t('warningEfMissing', { sourceName: w.sourceName ?? '' })
  }
  if (warningMessage) {
    return (
      <ListItem disableGutters className={lineNumber !== null ? 'pl15' : undefined}>
        <Typography variant="body2">
          {lineNumber !== null ? '• ' : ''}
          {warningMessage}
        </Typography>
      </ListItem>
    )
  }

  const searched = formatEf(w.searchedName, w.searchedValue, w.searchedUnit)
  const found =
    w.foundTitle !== undefined || w.foundValue !== undefined ? formatEf(w.foundTitle, w.foundValue, w.foundUnit) : null

  return (
    <ListItem disableGutters className={lineNumber !== null ? 'pl15' : undefined}>
      <div>
        <Typography variant="body2">
          {lineNumber !== null ? '• ' : ''}
          {t('warningEfNotFound', { searched })}
        </Typography>
        {w.candidates ? (
          <>
            <Typography variant="body2" className="align-center gapped025">
              {t('warningEfAmbiguous')}
            </Typography>
            {w.candidates.map((c, j) => (
              <Typography key={j} variant="body2" className="align-center gapped025">
                {'  – '}
                {formatEf(c.foundTitle, c.foundValue, c.foundUnit)}
              </Typography>
            ))}
            <Typography variant="body2" fontWeight="bold" className="align-center gapped025">
              <ArrowForwardIcon className={styles.warningArrow} />
              {t('warningEfLeftEmpty')}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" fontWeight="bold" className="align-center gapped025">
            <ArrowForwardIcon className={styles.warningArrow} />
            {found ? `${t('warningEfReplacedBy')} ${found}` : t('warningEfLeftEmpty')}
          </Typography>
        )}
      </div>
    </ListItem>
  )
}

export default WarningItem
