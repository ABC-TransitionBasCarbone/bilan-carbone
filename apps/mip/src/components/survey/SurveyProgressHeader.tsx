import { getCategoryClassSuffix } from '@abc-transitionbascarbone/publicodes/form'
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
  const categoryClassSuffix = getCategoryClassSuffix(categoryKey)
  const toneClass =
    (categoryClassSuffix ? styles[`progressTone${categoryClassSuffix}`] : undefined) ?? styles.progressToneDt

  return (
    <div className="mb1">
      <div className="flex">
        <div className={styles.categoryHeaderLabel}>
          {icons} {title}
        </div>
      </div>
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
