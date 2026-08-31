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
  const normalizedCategoryKey = (() => {
    switch (categoryKey) {
      case 'numérique':
        return 'divers'
      case 'bureaux':
        return 'logement'
      default:
        return categoryKey
    }
  })()

  const categoryClassSuffix = getCategoryClassSuffix(normalizedCategoryKey)
  const toneClass =
    (categoryClassSuffix ? styles[`progressTone${categoryClassSuffix}`] : undefined) ?? styles.progressToneDt

  const barClassName = classNames(styles.progressBar, toneClass, {
    [styles.progressBarCategory]: !!normalizedCategoryKey,
  })

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
        <LinearProgress className={barClassName} variant="determinate" value={progress} />
      </div>
    </div>
  )
}

export default SurveyProgressHeader
