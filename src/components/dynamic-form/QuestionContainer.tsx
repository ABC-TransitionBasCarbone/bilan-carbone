import { emissionFactorMap } from '@/constants/emissionFactorMap'
import { ID_INTERN_PREFIX_REGEX } from '@/constants/utils'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { Box, Tooltip, Typography } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './QuestionContainer.module.css'
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
  const inTable = ID_INTERN_PREFIX_REGEX.test(question.idIntern) && question.type !== FieldType.TABLE
  const tResultsUnits = useTranslations('study.results.units')
  const tQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const helperText = emissionFactorMap[question.idIntern]?.helperText

  if (inTable) {
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
        <Box display="flex" alignItems="center" gap={1}>
          <StyledQuestionTitle>{question.label}</StyledQuestionTitle>
          {helperText && (
            <Tooltip title={helperText} arrow placement="right">
              <button
                type="button"
                className={classNames('flex-cc', styles.helpButton)}
                aria-label={tQuestions('helpAriaLabel')}
                tabIndex={0}
              >
                <HelpOutlineIcon color="primary" fontSize="small" />
              </button>
            </Tooltip>
          )}
        </Box>
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
