import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Box, styled, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import SaveStatusIndicator from './SaveStatusIndicator'
import { EmissionResults, QuestionContainerProps } from './types/formTypes'

const StyledQuestionContainer = styled(Box)(() => ({
  marginBottom: '2rem',
  opacity: 1,
  '&.loading': {
    opacity: 0.5,
  },
}))

const StyledQuestionHeader = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  padding: '1rem 1.5rem',
  borderRadius: '0.5rem 0.5rem 0 0',
  marginBottom: 0,
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}))

const StyledQuestionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontWeight: 600,
  fontSize: '1rem',
  margin: 0,
}))

const StyledQuestionContent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  padding: '1.5rem',
  borderRadius: '0 0 0.5rem 0.5rem',
  border: `1px solid ${theme.palette.divider}`,
  borderTop: 'none',
}))

const StyledEmissionResults = styled(Box)(({ theme }) => ({
  marginTop: '1rem',
  padding: '1rem',
  backgroundColor: theme.palette.grey[50],
  borderRadius: '0.25rem',
  borderLeft: `4px solid ${theme.palette.success.main}`,
  '& p': {
    margin: '0 0 0.5rem 0',
    fontWeight: 600,
    color: theme.palette.text.primary,
  },
}))

const QuestionContainer = ({
  question,
  children,
  isLoading,
  showResults,
  results,
  saveStatus,
}: QuestionContainerProps) => {
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
    <StyledQuestionContainer className={isLoading ? 'loading' : ''}>
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
