'use client'

import { AmbiguousRow, FEChoices } from '@/types/import.types'
import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './ImportFileModal.module.css'

interface Props {
  rows: AmbiguousRow[]
  choices: FEChoices
  onChange: (lineNumber: number, value: string | null) => void
}

const AmbiguousEmissionFactorList = ({ rows, choices, onChange }: Props) => {
  const t = useTranslations('importFileModal')
  const tCommon = useTranslations('common')

  return (
    <div className={classNames(styles.ambiguousWrapper, 'flex-col gapped1')}>
      <Typography variant="body2" color="textSecondary">
        {t('ambiguousTitle')}
      </Typography>
      {rows.map((row) => (
        <div key={row.lineNumber} className={styles.ambiguousRow}>
          <Typography variant="body2" fontWeight="medium">
            {tCommon('label.line', { line: row.lineNumber })}
            {row.sourceName ? ` — ${row.sourceName}` : ''}
          </Typography>
          {row.searchedName && (
            <Typography variant="caption" color="textSecondary">
              {t('ambiguousSearched', { name: row.searchedName })}
            </Typography>
          )}
          {row.tooMany ? (
            <Typography variant="body2">{t('ambiguousTooMany')}</Typography>
          ) : (
            <RadioGroup
              value={choices[row.lineNumber] ?? 'null'}
              onChange={(e) => onChange(row.lineNumber, e.target.value === 'null' ? null : e.target.value)}
            >
              {row.candidates.map((c) => (
                <FormControlLabel
                  key={c.id}
                  value={c.id}
                  control={<Radio size="small" />}
                  label={
                    <Typography variant="body2">
                      {[c.foundTitle, c.foundValue !== undefined ? `${c.foundValue}` : undefined, c.foundUnit]
                        .filter(Boolean)
                        .join(' · ')}
                    </Typography>
                  }
                />
              ))}
              <FormControlLabel
                value="null"
                control={<Radio size="small" />}
                label={
                  <Typography variant="body2" color="textSecondary">
                    {t('leaveEmpty')}
                  </Typography>
                }
              />
            </RadioGroup>
          )}
        </div>
      ))}
    </div>
  )
}

export default AmbiguousEmissionFactorList
