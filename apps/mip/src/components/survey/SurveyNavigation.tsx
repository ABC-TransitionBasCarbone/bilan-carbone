import { ArrowBack, ArrowForward, Check } from '@mui/icons-material'
import { Button } from '@mui/material'
import styles from './Survey.module.css'

interface Props {
  hasPreviousPage: boolean
  canGoBackToExplanation?: boolean
  isLastPage: boolean
  isCompleting: boolean
  backToExplanationLabel?: string
  previousLabel: string
  nextLabel: string
  completeLabel: string
  onBackToExplanation?: () => void
  onPrevious: () => void
  onNext: () => void
  onComplete: () => Promise<void>
}

const SurveyNavigation = ({
  hasPreviousPage,
  canGoBackToExplanation = false,
  isLastPage,
  isCompleting,
  backToExplanationLabel,
  previousLabel,
  nextLabel,
  completeLabel,
  onBackToExplanation,
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
      ) : canGoBackToExplanation && onBackToExplanation && backToExplanationLabel ? (
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={onBackToExplanation}
          data-testid="survey-back-to-explanation-button"
        >
          {backToExplanationLabel}
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
