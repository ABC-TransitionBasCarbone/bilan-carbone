import HelpIcon from '@/components/base/HelpIcon'
import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import { TrajectoryFormData } from '@/services/serverFunctions/trajectory.command'
import { BaseObjective } from '@/utils/trajectory'
import DeleteIcon from '@mui/icons-material/Delete'
import { IconButton } from '@mui/material'
import Typography from '@mui/material/Typography'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'
import { Control } from 'react-hook-form'
import styles from './ObjectiveCard.module.css'

interface Props {
  reductionRate?: number
  name?: string
  isEditable: boolean
  control: Control<TrajectoryFormData>
  index: number
  onDelete?: () => void
  correctedObjective: BaseObjective | null
}

const ObjectiveCard = ({ reductionRate, name, isEditable, control, index, onDelete, correctedObjective }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')
  const tGlossary = useTranslations('study.transitionPlan.trajectoryModal.glossary')
  const [showOvershootInfo, setShowOvershootInfo] = useState(false)

  const correctedRates = useMemo(() => {
    if (!correctedObjective) {
      return null
    }

    return (
      <div>
        <div className="flex align-center gapped-2">
          <Typography variant="body1" color="warning">
            {t('objectives.correctedRate')}
          </Typography>
          <HelpIcon color="warning" onClick={() => setShowOvershootInfo(true)} label={t('objectives.overshootInfo')} />
        </div>
        <Typography color="warning" fontWeight="bold">
          {(correctedObjective.reductionRate * 100).toFixed(1)}%
        </Typography>
      </div>
    )
  }, [correctedObjective, setShowOvershootInfo, t])

  return (
    <div className={classNames(styles.objectiveCard, 'grow px15 py1')}>
      <div className="flex justify-between">
        <Typography className={styles.objectiveLabel} color="textSecondary">
          {t('objectives.global')}
        </Typography>
        {isEditable && !!onDelete && (
          <IconButton color="error" onClick={onDelete}>
            <DeleteIcon className="cursor-pointer" />
          </IconButton>
        )}
      </div>
      <div className="flex gapped1 align-end">
        <div className="grow">
          {!isEditable ? (
            <div className="flex-col gapped-2">
              <Typography color="primary" fontWeight="bold">
                {name}
              </Typography>

              <div>
                <Typography variant="body1" color="textSecondary">
                  {t('objectives.referenceRate')}
                </Typography>
                <Typography fontWeight="bold" color="primary">
                  {reductionRate ? `-${(reductionRate * 100).toFixed(1)}%` : ''}
                </Typography>
              </div>
              {correctedRates}
            </div>
          ) : (
            <div className="flex-col gapped1">
              <FormDatePicker
                name={`objectives.${index}.targetYear`}
                label={t('objectives.year')}
                control={control}
                className="w100"
                views={['year']}
                data-testid="objective-year-picker"
                minDate={dayjs()}
                clearable
              />
              <FormTextField
                name={`objectives.${index}.reductionRate`}
                label={t('objectives.reductionRate')}
                control={control}
                className="w100"
                type="number"
                placeholder={t('objectives.reductionRatePlaceholder')}
                data-testid="objective-reduction-rate-input"
              />
              {correctedRates}
            </div>
          )}
        </div>
      </div>
      {showOvershootInfo && (
        <GlossaryModal
          glossary="correctedRate"
          label="corrected-rate"
          t={tGlossary}
          onClose={() => setShowOvershootInfo(false)}
        >
          {tGlossary('correctedRateDescription')}
        </GlossaryModal>
      )}
    </div>
  )
}

export default ObjectiveCard
