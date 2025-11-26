'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import { MultiSelect } from '@/components/base/MultiSelect'
import { TrajectoryWithObjectives } from '@/db/transitionPlan'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import styles from '../../pages/TrajectoryReductionPage.module.css'

interface Props {
  trajectories: TrajectoryWithObjectives[]
  selectedTrajectoryIds: string[]
  onSelectionChange: (ids: string[]) => void
  onAddTrajectory: () => void
  title: string
  addButtonLabel: string
  selectLabel: string
  canEdit: boolean
}

const MyTrajectoriesCard = ({
  trajectories,
  selectedTrajectoryIds,
  onSelectionChange,
  onAddTrajectory,
  title,
  addButtonLabel,
  selectLabel,
  canEdit,
}: Props) => {
  const trajectoryOptions = trajectories.map((trajectory) => ({
    label: trajectory.name,
    value: trajectory.id,
  }))

  return (
    <Box className={classNames('p125 flex-col justify-between gapped2', styles.trajectoryCard)}>
      <div className="flex-col gapped-2">
        <Typography variant="h5" component="h2" fontWeight={600}>
          {title}
        </Typography>
        {canEdit && (
          <Button onClick={onAddTrajectory} variant="outlined">
            {addButtonLabel}
          </Button>
        )}
      </div>

      <div className="w100 flex-col gapped-2">
        <MultiSelect
          label={selectLabel}
          value={selectedTrajectoryIds}
          onChange={onSelectionChange}
          options={trajectoryOptions}
          placeholder={selectLabel}
        />
      </div>
    </Box>
  )
}

export default MyTrajectoriesCard
