import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import {
  StyledEmissionResults,
  StyledQuestionContainer,
  StyledQuestionContent,
  StyledQuestionHeader,
  StyledQuestionTitle,
} from './QuestionContainer.styles'
import SaveStatusIndicator from './SaveStatusIndicator'
import { EmissionResults, QuestionContainerProps } from './types/formTypes'

const QuestionContainer = ({ question, children, showResults, results, saveStatus }: QuestionContainerProps) => {
  const tResultsUnits = useTranslations('study.results.units')

  const formatEmissionResults = (results: EmissionResults) => {
    if (!results || !results.emission) {
      return ''
    }

    const unit = (results.unit || 'T') as keyof typeof STUDY_UNIT_VALUES
    const emission = results.emission / STUDY_UNIT_VALUES[unit]
    return `${formatNumber(emission)} ${tResultsUnits(unit)}`
  }

  return (
    <StyledQuestionContainer>
      <StyledQuestionHeader>
        <StyledQuestionTitle>{question.label}</StyledQuestionTitle>
        {saveStatus && <SaveStatusIndicator status={saveStatus} />}
      </StyledQuestionHeader>

      <StyledQuestionContent>
        {children}

        {showResults && results && (
          <StyledEmissionResults>
            <Typography>{formatEmissionResults(results)}</Typography>
          </StyledEmissionResults>
        )}
      </StyledQuestionContent>
    </StyledQuestionContainer>
  )
}

export default QuestionContainer
