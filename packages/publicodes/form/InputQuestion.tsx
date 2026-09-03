import { usePublicodesRuleTranslation } from '@abc-transitionbascarbone/publicodes/hooks'
import Box from '@mui/material/Box'
import { EvaluatedFormElement } from '@publicodes/forms'
import Engine from 'publicodes'
import { InputField as PublicodesInputField } from './InputField'
import { QuestionContainer } from './QuestionContainer'
import { FILTER_RULE_KEY, OnFieldChange } from './utils'

interface InputQuestionProps<RuleName extends string> {
  formElement: EvaluatedFormElement<RuleName>
  onChange: OnFieldChange<RuleName>
  engine?: Engine<RuleName>
  containerVariant?: 'default' | 'flat'
}

export const InputQuestion = <RuleName extends string>({
  formElement,
  onChange,
  engine,
  containerVariant = 'default',
}: InputQuestionProps<RuleName>) => {
  const translation = usePublicodesRuleTranslation(formElement.id)
  const rawRule = engine?.getParsedRules()[formElement.id]?.rawNode as { description?: string; suggestions?: Record<string, string | number | Record<string, unknown>> } | undefined
  const question = translation?.question
  const description = translation?.description ?? rawRule?.description

  const suggestions = rawRule?.suggestions
  const isFilteringQuestion = formElement.id === FILTER_RULE_KEY

  return (
    <Box key={formElement.id} className="mb2">
      <QuestionContainer
        label={question ?? formElement.label ?? formElement.id}
        description={description}
        variant={containerVariant}
      >
        <PublicodesInputField
          formElement={formElement}
          onChange={onChange}
          suggestions={suggestions}
          isFilteringQuestion={isFilteringQuestion}
        />
      </QuestionContainer>
    </Box>
  )
}
