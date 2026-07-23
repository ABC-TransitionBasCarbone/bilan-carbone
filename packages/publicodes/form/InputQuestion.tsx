import { usePublicodesRuleTranslation } from '@abc-transitionbascarbone/publicodes/hooks'
import Box from '@mui/material/Box'
import { EvaluatedFormElement } from '@publicodes/forms'
import Engine from 'publicodes'
import { InputField as PublicodesInputField } from './InputField'
import { QuestionContainer } from './QuestionContainer'
import { OnFieldChange } from './utils'

interface InputQuestionProps<RuleName extends string> {
  formElement: EvaluatedFormElement<RuleName>
  onChange: OnFieldChange<RuleName>
  engine?: Engine<RuleName>
}

export function InputQuestion<RuleName extends string>({ formElement, onChange, engine }: InputQuestionProps<RuleName>) {
  const translation = usePublicodesRuleTranslation(formElement.id)

  const publicodeRules = engine?.getParsedRules()[formElement.id]?.rawNode
  const question = publicodeRules?.question ?? translation?.question
  const description = publicodeRules?.description ?? translation?.description
  const suggestions = publicodeRules?.suggestions

  return (
    <Box key={formElement.id} className="mb2">
      <QuestionContainer label={question ?? formElement.label ?? formElement.id} description={description}>
        <PublicodesInputField formElement={formElement} onChange={onChange} suggestions={suggestions} />
      </QuestionContainer>
    </Box>
  )
}
