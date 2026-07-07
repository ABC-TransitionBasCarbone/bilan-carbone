import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { Button } from '@mui/material'
import styles from './Survey.module.css'

interface Props {
  hasPreviousPage: boolean
  isLastPage: boolean
  previousLabel: string
  nextLabel: string
  completeLabel: string
  onPrevious: () => void
  onNext: () => void
  onComplete: () => void
}

const SurveyNavigation = ({
  hasPreviousPage,
  isLastPage,
  previousLabel,
  nextLabel,
  completeLabel,
  onPrevious,
  onNext,
  onComplete,
}: Props) => {
  return (
    <div className={styles.navigation}>
      {hasPreviousPage ? (
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious}>
          {previousLabel}
        </Button>
      ) : (
        <div />
      )}
      {isLastPage ? (
        <Button variant="contained" color="success" endIcon={<Check />} onClick={onComplete}>
          {completeLabel}
        </Button>
      ) : (
        <Button variant="contained" endIcon={<ArrowForward />} onClick={onNext}>
          {nextLabel}
        </Button>
      )}
    </div>
  )
}

export default SurveyNavigation
