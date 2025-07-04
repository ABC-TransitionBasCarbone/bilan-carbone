import { ID_INTERN_PREFIX_REGEX } from '@/constants/utils'
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
import { FieldType } from './types/questionTypes'

const QuestionContainer = ({ question, children, showResults, results, saveStatus }: QuestionContainerProps) => {
  const hasPrefixIdIntern = ID_INTERN_PREFIX_REGEX.test(question.idIntern)
  const inTable = hasPrefixIdIntern && question.type !== FieldType.TABLE
  const inTitle = hasPrefixIdIntern && question.type !== FieldType.TITLE

  const tResultsUnits = useTranslations('study.results.units')
  if (inTable && inTitle) {
    return
  }

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
