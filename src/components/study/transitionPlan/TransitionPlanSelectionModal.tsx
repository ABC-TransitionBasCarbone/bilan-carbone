'use client'

import Modal from '@/components/modals/Modal'
import { TransitionPlanWithStudies } from '@/db/transitionPlan'
import { customRich } from '@/i18n/customRich'
import { getAvailableTransitionPlans } from '@/services/serverFunctions/transitionPlan'
import { FormControl, FormControlLabel, MenuItem, Radio, RadioGroup, Select } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import styles from './TransitionPlanSelectionModal.module.css'

interface Props {
  studyId: string
  open: boolean
  onClose: () => void
  onConfirm: (selectedPlanId?: string) => Promise<void>
}

const TransitionPlanSelectionModal = ({ studyId, open, onClose, onConfirm }: Props) => {
  const t = useTranslations('study.transitionPlan.modal')
  const [availablePlans, setAvailablePlans] = useState<TransitionPlanWithStudies[] | null>(null)
  const [selectedOption, setSelectedOption] = useState<'new' | 'existing'>('new')
  const [selectedPlan, setSelectedPlan] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const hasAvailablePlans = availablePlans && availablePlans.length > 0

  useEffect(() => {
    const fetchAvailablePlans = async () => {
      const plansResponse = await getAvailableTransitionPlans(studyId)
      if (plansResponse.success && plansResponse.data) {
        setAvailablePlans(plansResponse.data)

        if (plansResponse.data.length > 0) {
          setSelectedPlan(plansResponse.data[0].id)
        }
      }
    }

    if (availablePlans === null) {
      fetchAvailablePlans()
    }
  }, [availablePlans, studyId])

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const planId = selectedOption === 'new' ? undefined : selectedPlan
      await onConfirm(planId)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      label="transition-plan-selection"
      actions={[
        {
          onClick: onClose,
          children: t('cancel'),
          variant: 'outlined',
          color: 'secondary',
        },
        {
          actionType: 'loadingButton',
          onClick: handleConfirm,
          children: t('confirm'),
          loading,
          'data-testid': 'confirm-transition-plan-selection',
        },
      ]}
    >
      <div className={classNames('flex-col', 'gapped15')}>
        <p className={styles.description}>{customRich(t, 'description')}</p>

        <FormControl
          component="fieldset"
          className={classNames('flex-col', 'mt1', 'w100', 'gapped075', styles.radioGroup)}
        >
          <RadioGroup value={selectedOption} onChange={(e) => setSelectedOption(e.target.value as 'new' | 'existing')}>
            <FormControlLabel
              value="new"
              control={<Radio />}
              label={
                <div className={'flex-col'}>
                  <span className={styles.optionTitle}>{t('createNew')}</span>
                  <span className={styles.optionDescription}>{t('createNewDescription')}</span>
                </div>
              }
            />

            <FormControlLabel
              value="existing"
              control={<Radio />}
              disabled={!hasAvailablePlans}
              label={
                <div className={'flex-col'}>
                  <span className={classNames(styles.optionTitle)}>{t('reuseExisting')}</span>
                  {hasAvailablePlans && (
                    <span className={styles.optionDescription}>{customRich(t, 'reuseExistingDescription')}</span>
                  )}
                  {selectedOption === 'existing' && hasAvailablePlans && (
                    <FormControl fullWidth className={'mt-2'}>
                      <Select value={selectedPlan} onChange={(e) => setSelectedPlan(e.target.value)} size="small">
                        {availablePlans?.map((plan) => (
                          <MenuItem key={plan.id} value={plan.id}>
                            {t('studyPrefix')} {plan.study.name} - {formatDate(plan.study.startDate)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  {!hasAvailablePlans && <span className={styles.noPlansMessage}>{t('noAvailablePlans')}</span>}
                </div>
              }
            />
          </RadioGroup>
        </FormControl>
      </div>
    </Modal>
  )
}

export default TransitionPlanSelectionModal
