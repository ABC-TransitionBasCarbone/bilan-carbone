import { FormTextField } from '@/components/form/TextField'
import { getReductionRatePerType } from '@/utils/trajectory'
import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { TrajectoryType } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, Controller } from 'react-hook-form'
import ObjectiveCard from './ObjectiveCard'
import { TrajectoryFormData } from './TrajectoryCreationModal'
import styles from './TrajectoryCreationModal.module.css'

interface Props {
  isSBTI: boolean
  trajectoryType: TrajectoryType
  control: Control<TrajectoryFormData>
}

const TrajectoryCreationStep2 = ({ isSBTI, trajectoryType, control }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')
  const reductionRate = getReductionRatePerType(trajectoryType)

  return (
    <div className="flex-col gapped15">
      <div className={classNames(styles.trajectoryOptionSelected, 'p1 wfit')}>
        <Typography variant="body1" fontWeight={600}>
          {isSBTI ? t(`selectedTrajectory.${trajectoryType}`) : t('selectedTrajectory.CUSTOM')}
        </Typography>
      </div>

      <FormTextField
        name="name"
        control={control}
        translation={t}
        label={t('name')}
        placeholder={t('namePlaceholder')}
        fullWidth
        required
      />

      <FormTextField
        name="description"
        control={control}
        translation={t}
        label={t('description')}
        placeholder={t('descriptionPlaceholder')}
        fullWidth
        multiline
        rows={3}
      />

      {isSBTI && (
        <Controller
          name="trajectoryType"
          control={control}
          render={({ field }) => (
            <div>
              <Typography variant="body1" fontWeight={600}>
                {t('sbtiType.title')}
              </Typography>
              <RadioGroup row value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                <FormControlLabel value={TrajectoryType.SBTI_15} control={<Radio />} label={t('sbtiType.15')} />
                <FormControlLabel value={TrajectoryType.SBTI_WB2C} control={<Radio />} label={t('sbtiType.wb2c')} />
              </RadioGroup>
            </div>
          )}
        />
      )}

      <div>
        <Typography variant="body1" fontWeight="bold" className="mb1">
          {t('objectives.title')}
        </Typography>
        {isSBTI && (
          <Typography variant="body2" color="textSecondary" className="mb1">
            {t('objectives.sbtiDescription')}
          </Typography>
        )}

        <div className="flex gapped15">
          <ObjectiveCard
            name={isSBTI ? t('objectives.horizon2030') : ''}
            reductionRate={reductionRate}
            isEditable={!isSBTI}
            control={control}
            index={0}
          />

          <ObjectiveCard
            name={isSBTI ? t('objectives.horizon2050') : ''}
            reductionRate={reductionRate}
            isEditable={!isSBTI}
            control={control}
            index={1}
          />
        </div>
      </div>
    </div>
  )
}

export default TrajectoryCreationStep2
