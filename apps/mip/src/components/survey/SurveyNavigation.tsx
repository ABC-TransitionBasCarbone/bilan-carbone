import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { Button } from '@mui/material'
import styles from './Survey.module.css'

interface Props {
  hasPreviousPage: boolean
  isLastPage: boolean
  isSubmittingCompletion?: boolean
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
  isSubmittingCompletion = false,
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
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={onPrevious}
          data-testid="survey-previous-button"
          disabled={isSubmittingCompletion}
        >
          {previousLabel}
        </Button>
      ) : null}
      {isLastPage ? (
        <Button
          variant="contained"
          color="success"
          endIcon={<Check />}
          onClick={onComplete}
          data-testid="survey-complete-button"
          disabled={isSubmittingCompletion}
        >
          {completeLabel}
        </Button>
      ) : (
        <Button
          variant="contained"
          endIcon={<ArrowForward />}
          onClick={onNext}
          data-testid="survey-next-button"
          disabled={isSubmittingCompletion}
        >
          {nextLabel}
        </Button>
      )}
    </div>
  )
}

export default SurveyNavigation
