import Category from '@/components/survey/Category/Category'
import { LinearProgress, Typography } from '@mui/material'
import classNames from 'classnames'
import styles from './Survey.module.css'

interface Props {
  title: string
  icons?: string
  progress: number
  categoryKey?: string | null
  questionLabel: string
  completionLabel: string
}

const SurveyProgressHeader = ({ title, icons, progress, categoryKey, questionLabel, completionLabel }: Props) => {
  const toneSuffix =
    categoryKey === 'DT' ? 'Dt' : (categoryKey?.charAt(0).toUpperCase() ?? '') + (categoryKey?.slice(1) ?? '')
  const toneClass = toneSuffix ? styles[`progressTone${toneSuffix}`] : undefined

  return (
    <div className="mb1">
      <Category title={title} icons={icons} />
      <div className={styles.progress}>
        <div className="justify-between mb-2">
          <Typography variant="body2" color="text.secondary">
            {questionLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {completionLabel}
          </Typography>
        </div>
        <LinearProgress className={classNames(styles.progressBar, toneClass)} variant="determinate" value={progress} />
      </div>
    </div>
  )
}

export default SurveyProgressHeader
