import { FormTextField } from '@/components/form/TextField'
import { TrajectoryFormData } from '@/services/serverFunctions/transitionPlan.command'
import { toTitleCase } from '@/utils/string'
import { getReductionRatePerType } from '@/utils/trajectory'
import { FormControlLabel, Radio, RadioGroup, Typography } from '@mui/material'
import { TrajectoryType } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, Controller } from 'react-hook-form'
import ObjectiveCard from './ObjectiveCard'
import styles from './TrajectoryCreationModal.module.css'

interface Props {
  isSBTI: boolean
  trajectoryType: TrajectoryType
  control: Control<TrajectoryFormData>
  showTrajectoryTypeSelector: boolean
  handleModeSelect: (type: TrajectoryType) => void
}

const TrajectoryCreationStep2 = ({
  isSBTI,
  trajectoryType,
  control,
  showTrajectoryTypeSelector,
  handleModeSelect,
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')
  const reductionRate = getReductionRatePerType(trajectoryType)

  const getMainTrajectoryType = () => {
    if (trajectoryType === TrajectoryType.SBTI_15 || trajectoryType === TrajectoryType.SBTI_WB2C) {
      return 'SBTI'
    }
    return trajectoryType
  }

  const handleMainTypeChange = (value: string) => {
    if (value === 'SBTI') {
      handleModeSelect(TrajectoryType.SBTI_15)
    } else {
      handleModeSelect(value as TrajectoryType)
    }
  }

  return (
    <div className="flex-col gapped15">
      {showTrajectoryTypeSelector ? (
        <div>
          <Typography variant="body1" fontWeight={600} className="mb075">
            {t('steps.chooseTrajectory')}
          </Typography>
          <RadioGroup row value={getMainTrajectoryType()} onChange={(e) => handleMainTypeChange(e.target.value)}>
            <FormControlLabel value="SBTI" control={<Radio />} label={t('sbti.title')} />
            <FormControlLabel value={TrajectoryType.SNBC} control={<Radio />} label={t('snbc.title')} disabled />
            <FormControlLabel
              value={TrajectoryType.CUSTOM}
              control={<Radio />}
              label={toTitleCase(t('custom.title'))}
            />
          </RadioGroup>
        </div>
      ) : (
        <div className={classNames(styles.trajectoryOptionSelected, 'p1 wfit')}>
          <Typography variant="body1" fontWeight={600}>
            {isSBTI ? t(`selectedTrajectory.${trajectoryType}`) : t('selectedTrajectory.CUSTOM')}
          </Typography>
        </div>
      )}

      <FormTextField
        name="name"
        control={control}
        label={t('name')}
        placeholder={t('namePlaceholder')}
        fullWidth
        required
      />

      <FormTextField
        name="description"
        control={control}
        label={t('description')}
        placeholder={t('descriptionPlaceholder')}
        fullWidth
        multiline
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
