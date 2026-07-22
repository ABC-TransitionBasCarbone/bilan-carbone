import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { Button } from '@mui/material'
import styles from './Survey.module.css'

interface Props {
  hasPreviousPage: boolean
  isLastPage: boolean
  isCompleting: boolean
  previousLabel: string
  nextLabel: string
  completeLabel: string
  onPrevious: () => void
  onNext: () => void
  onComplete: () => Promise<void>
}

const SurveyNavigation = ({
  hasPreviousPage,
  isLastPage,
  isCompleting,
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
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={onPrevious} data-testid="survey-previous-button">
          {previousLabel}
        </Button>
      ) : null}
      {isLastPage ? (
        <Button
          variant="contained"
          color="success"
          endIcon={<Check />}
          onClick={() => {
            void onComplete()
          }}
          disabled={isCompleting}
          data-testid="survey-complete-button"
        >
          {completeLabel}
        </Button>
      ) : (
        <Button variant="contained" endIcon={<ArrowForward />} onClick={onNext} data-testid="survey-next-button">
          {nextLabel}
        </Button>
      )}
    </div>
  )
}

export default SurveyNavigation
