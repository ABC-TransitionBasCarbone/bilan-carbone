'use client'

import Modal from '@/components/modals/Modal'
import { SECTEN_SECTORS } from '@/constants/trajectories'
import { SectenVersionDiff } from '@/utils/secten'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import styles from './SectenUpdateModal.module.css'

interface Props {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  diff: SectenVersionDiff
  isLoading?: boolean
}

const SectenUpdateModal = ({ open, onClose, onConfirm, diff, isLoading }: Props) => {
  const tCommon = useTranslations('common')
  const t = useTranslations('study.transitionPlan.trajectories')

  const modifiedYears = [...new Set(diff.modified.map((e) => e.year))].sort((a, b) => b - a)
  const addedYears = [...new Set(diff.added.map((e) => e.year))].sort((a, b) => b - a)

  return (
    <Modal
      label="secten-update"
      open={open}
      onClose={onClose}
      title={t('snbcCard.sectenUpdateModal.title')}
      big
      actions={[
        { children: tCommon('action.cancel'), onClick: onClose, variant: 'outlined' },
        {
          actionType: 'loadingButton',
          children: tCommon('action.update'),
          onClick: onConfirm,
          loading: isLoading ?? false,
        },
      ]}
    >
      <Typography className="mb1">{t('snbcCard.sectenUpdateModal.description')}</Typography>

      {(modifiedYears.length > 0 || addedYears.length > 0) && (
        <div className="mb1">
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{tCommon('year')}</TableCell>
                  {SECTEN_SECTORS.map((sector) => (
                    <TableCell key={sector} align="right">
                      {t(`snbcCard.${sector}`)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {addedYears.map((year) => (
                  <TableRow key={`added-${year}`} className={styles.tableBody}>
                    <TableCell>
                      <span className={styles.increase}>{year}</span>
                    </TableCell>
                    {SECTEN_SECTORS.map((sector) => {
                      const entry = diff.added.find((e) => e.year === year && e.sector === sector)
                      return (
                        <TableCell key={sector} align="right">
                          {entry && <span className={styles.increase}>{entry.value / 1000} MtCO2</span>}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
                {modifiedYears.map((year) => (
                  <TableRow key={`modified-${year}`} className={styles.tableBody}>
                    <TableCell>{year}</TableCell>
                    {SECTEN_SECTORS.map((sector) => {
                      const entry = diff.modified.find((e) => e.year === year && e.sector === sector)
                      if (!entry) {
                        return <TableCell key={sector} />
                      }
                      const diff_val = entry.newValue / 1000 - entry.oldValue / 1000
                      const isIncrease = entry.newValue > entry.oldValue
                      return (
                        <TableCell key={sector} align="right">
                          <span className={isIncrease ? styles.increase : styles.decrease}>
                            {entry.newValue / 1000} MtCO2
                            <span>
                              &nbsp;({isIncrease ? '+' : ''}
                              {diff_val})
                            </span>
                          </span>
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      )}
    </Modal>
  )
}

export default SectenUpdateModal
