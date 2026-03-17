import Box from '@/components/base/Box'
import { MultiSelect } from '@/components/base/MultiSelect'
import {
  TRAJECTORY_15_ID,
  TRAJECTORY_SNBC_AGRICULTURE_ID,
  TRAJECTORY_SNBC_BUILDINGS_ID,
  TRAJECTORY_SNBC_ENERGY_ID,
  TRAJECTORY_SNBC_GENERAL_ID,
  TRAJECTORY_SNBC_INDUSTRY_ID,
  TRAJECTORY_SNBC_TRANSPORTATION_ID,
  TRAJECTORY_SNBC_WASTE_ID,
  TRAJECTORY_WB2C_ID,
} from '@/constants/trajectories'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { customRich } from '@/i18n/customRich'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './ReferenceTrajectorySelectionSection.module.css'

interface Props {
  selectedSnbcTrajectories: string[]
  setSelectedSnbcTrajectories: (trajectories: string[]) => void
  selectedSbtiTrajectories: string[]
  setSelectedSbtiTrajectories: (trajectories: string[]) => void
  customSnbcSectoralTrajectory: TrajectoryWithObjectives | null // Default SNBC sectoral trajectory created from percentages
}

export const ReferenceTrajectorySelectionSection = ({
  selectedSnbcTrajectories,
  setSelectedSnbcTrajectories,
  selectedSbtiTrajectories,
  setSelectedSbtiTrajectories,
  customSnbcSectoralTrajectory,
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories')

  return (
    <div className={classNames('grid gapped1', styles.trajectoryCardsGrid)}>
      <Box className={classNames('p125 flex-col justify-between gapped2', styles.trajectoryCard)}>
        <Typography variant="body1">{customRich(t, 'snbcCard.description')}</Typography>
        <div className="w100 flex-col gapped-2">
          <MultiSelect
            label={t('snbcCard.methodLabel')}
            value={selectedSnbcTrajectories}
            onChange={setSelectedSnbcTrajectories}
            options={[
              ...(customSnbcSectoralTrajectory
                ? [{ label: customSnbcSectoralTrajectory.name, value: customSnbcSectoralTrajectory.id }]
                : []),
              { label: t('snbcCard.general'), value: TRAJECTORY_SNBC_GENERAL_ID },
              { label: t('snbcCard.energy'), value: TRAJECTORY_SNBC_ENERGY_ID },
              { label: t('snbcCard.industry'), value: TRAJECTORY_SNBC_INDUSTRY_ID },
              { label: t('snbcCard.waste'), value: TRAJECTORY_SNBC_WASTE_ID },
              { label: t('snbcCard.buildings'), value: TRAJECTORY_SNBC_BUILDINGS_ID },
              { label: t('snbcCard.agriculture'), value: TRAJECTORY_SNBC_AGRICULTURE_ID },
              { label: t('snbcCard.transportation'), value: TRAJECTORY_SNBC_TRANSPORTATION_ID },
            ]}
            placeholder={t('snbcCard.placeholder')}
          />
        </div>
      </Box>
      <Box className={classNames('p125 flex-col justify-between gapped2', styles.trajectoryCard)}>
        <Typography variant="body1">{customRich(t, 'sbtiCard.description')}</Typography>
        <div className="w100 flex-col gapped-2">
          <MultiSelect
            label={t('sbtiCard.methodLabel')}
            value={selectedSbtiTrajectories}
            onChange={setSelectedSbtiTrajectories}
            options={[
              { label: t('sbtiCard.option15'), value: TRAJECTORY_15_ID },
              { label: t('sbtiCard.optionWB2C'), value: TRAJECTORY_WB2C_ID },
            ]}
            placeholder={t('sbtiCard.placeholder')}
          />
        </div>
      </Box>
    </div>
  )
}
