import { Chip, Typography } from '@mui/material'
import { DataType } from './TrajectoryGraph'

interface Props {
  title: string
  data: { label: string; dataType: DataType; color: string }[]
  onClick: (label: string) => void
}

const TrajectoryLegendTable = ({ title, data, onClick }: Props) => {
  const previousTrajectories = data.filter((d) => d.dataType === 'previous')
  const currentTrajectories = data.filter((d) => d.dataType === 'current')
  const trajectories = [
    { title: 'Previous trajectories', data: previousTrajectories },
    { title: 'Current trajectories', data: currentTrajectories },
  ]

  return (
    <div className="w50">
      <Typography variant="h5" component="h2" fontWeight={600} className="text-center mb-2">
        {title}
      </Typography>
      <div className="flex justify-around">
        {trajectories.map(
          (group) =>
            group.data.length > 0 && (
              <div className="flex-col gapped1" key={group.title}>
                <Typography fontWeight="bold" variant="h6">
                  {group.title}
                </Typography>
                {group.data.map((item) => (
                  <Chip
                    className="bold"
                    key={item.label as string}
                    label={item.label as string}
                    style={{ backgroundColor: item.color }}
                    onClick={() => onClick(item.label)}
                  />
                ))}
              </div>
            ),
        )}
      </div>
    </div>
  )
}

export default TrajectoryLegendTable
