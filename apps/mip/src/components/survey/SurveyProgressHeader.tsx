import Category from '@/components/survey/Category/Category'
import { LinearProgress, Typography } from '@mui/material'
import styles from './Survey.module.css'

interface Props {
  title: string
  icons?: string
  progress: number
  questionLabel: string
  completionLabel: string
}

const SurveyProgressHeader = ({ title, icons, progress, questionLabel, completionLabel }: Props) => {
  return (
    <div className={styles.header}>
      <Category title={title} icons={icons} />
      <div className={styles.progress}>
        <div className={styles.progressLabels}>
          <Typography variant="body2" color="text.secondary">
            {questionLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completionLabel}
          </Typography>
        </div>
        <LinearProgress variant="determinate" value={progress} />
      </div>
    </div>
  )
}

export default SurveyProgressHeader
