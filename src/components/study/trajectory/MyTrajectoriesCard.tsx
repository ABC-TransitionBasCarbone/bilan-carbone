'use client'

import Box from '@/components/base/Box'
import Button from '@/components/base/Button'
import { MultiSelect } from '@/components/base/MultiSelect'
import { TrajectoryWithObjectives } from '@/db/trajectory'
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
}

const MyTrajectoriesCard = ({
  trajectories,
  selectedTrajectoryIds,
  onSelectionChange,
  onAddTrajectory,
  title,
  addButtonLabel,
  selectLabel,
}: Props) => {
  const trajectoryOptions = trajectories.map((trajectory) => ({
    label: trajectory.name,
    value: trajectory.id,
  }))

  return (
    <Box className={classNames('p125 flex-col gapped075', styles.trajectoryCard)}>
      <Typography variant="h5" component="h2" fontWeight={600}>
        {title}
      </Typography>

      <Button onClick={onAddTrajectory} variant="outlined">
        {addButtonLabel}
      </Button>

      <div className={'w100 flex-col gapped075'}>
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
