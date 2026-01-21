import TagChip from '@/components/base/TagChip'
import { Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { DataType } from './TrajectoryGraph'
import styles from './TrajectoryLegendTable.module.css'

interface Props {
  studyStartYear: number
  title: string
  data: { label: string; dataType: DataType; color: string }[]
  filteredSeriesLabels: string[]
  onClick: (label: string) => void
  border?: boolean
}

const TrajectoryLegendTable = ({ title, data, onClick, studyStartYear, border, filteredSeriesLabels }: Props) => {
  const t = useTranslations('study.transitionPlan.trajectories.graph')
  const previousTrajectories = data.filter((d) => d.dataType === 'previous')
  const currentTrajectories = data.filter((d) => d.dataType === 'current')
  const trajectories = [
    { title: t('previousTrajectories'), data: previousTrajectories },
    { title: `${t('currentTrajectories')} (${studyStartYear})`, data: currentTrajectories },
  ]

  return (
    <div className={classNames('w50', border && styles.borderRight)}>
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
                  <TagChip
                    className={classNames('bold', filteredSeriesLabels.includes(item.label) && styles.unselected)}
                    key={item.label as string}
                    name={item.label as string}
                    color={item.color}
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
