import { FormTextField } from '@/components/form/TextField'
import { SECTEN_SECTORS } from '@/constants/trajectories'
import { TrajectoryFormData } from '@/services/serverFunctions/trajectory.command'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, useWatch } from 'react-hook-form'
import { SectorFormData } from '../transitionPlan/SectorAllocationBlock'
import styles from './SectorPercentageInputs.module.css'

interface Props {
  canEdit: boolean
  control: Control<SectorFormData> | Control<TrajectoryFormData>
}

const SectorPercentageInputs = ({ canEdit, control }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal.sectors')

  const sectorPercentages = useWatch({
    control: control as Control<SectorFormData>,
    name: 'sectorPercentages',
  })

  const totalPercentage = sectorPercentages
    ? Object.values(sectorPercentages).reduce((sum, val) => sum + (val || 0), 0)
    : 0

  const remainingPercentage = 100 - totalPercentage
  const isOverLimit = totalPercentage > 100

  return (
    <div className="flex-col gapped1">
      <div className={classNames('grid gapped1', styles.sectorGrid)}>
        {SECTEN_SECTORS.map((sector) => (
          <FormTextField
            disabled={!canEdit}
            key={sector}
            name={`sectorPercentages.${sector}`}
            control={control as Control<SectorFormData>}
            label={t(sector)}
            type="number"
            placeholder={t('placeholder')}
            endAdornment={<Typography variant="body2">%</Typography>}
            slotProps={{
              htmlInput: {
                type: 'number',
                min: 0,
                max: 100,
                step: 1,
              },
            }}
          />
        ))}
      </div>
      <div className={classNames('flex justify-between items-center', styles.remainingGeneral)}>
        <Typography fontWeight={600} color="primary">
          {t('remainingGeneral')}
        </Typography>
        <Typography fontWeight={600} color="primary">
          {Math.max(0, remainingPercentage).toFixed(1)}%
        </Typography>
      </div>

      {isOverLimit && (
        <Typography variant="caption" color="error">
          {t('errorOverLimit')}
        </Typography>
      )}
    </div>
  )
}

export default SectorPercentageInputs
