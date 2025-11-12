import { FormDatePicker } from '@/components/form/DatePicker'
import { FormTextField } from '@/components/form/TextField'
import { TrajectoryFormData } from '@/services/serverFunctions/transitionPlan.command'
import Typography from '@mui/material/Typography'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useTranslations } from 'next-intl'
import { Control } from 'react-hook-form'
import styles from './ObjectiveCard.module.css'

interface Props {
  reductionRate?: number
  name?: string
  isEditable: boolean
  control: Control<TrajectoryFormData>
  index: number
}

const ObjectiveCard = ({ reductionRate, name, isEditable, control, index }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')

  return (
    <div className={classNames(styles.objectiveCard, 'grow px15 py1')}>
      <Typography className={styles.objectiveLabel} color="textSecondary">
        {t('objectives.global')}
      </Typography>
      <div className="flex gapped1 align-end">
        <div className="grow">
          {!isEditable ? (
            <>
              <Typography color="primary" fontWeight="bold">
                {name}
              </Typography>

              <Typography fontWeight="bold" color="primary">
                {reductionRate ? `-${(reductionRate * 100).toFixed(1)}%` : ''}
              </Typography>
            </>
          ) : (
            <div className="flex-col gapped1">
              <FormDatePicker
                name={`objectives.${index}.targetYear`}
                label={t('objectives.year')}
                control={control}
                translation={t}
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ObjectiveCard
