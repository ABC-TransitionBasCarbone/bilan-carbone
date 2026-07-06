import { usePublicodesRuleTranslation } from '@abc-transitionbascarbone/publicodes/hooks'
import Box from '@mui/material/Box'
import { EvaluatedFormElement } from '@publicodes/forms'
import { InputField as PublicodesInputField } from './InputField'
import { QuestionContainer } from './QuestionContainer'
import { OnFieldChange } from './utils'

interface InputQuestionProps<RuleName extends string> {
  formElement: EvaluatedFormElement<RuleName>
  onChange: OnFieldChange<RuleName>
}

export function InputQuestion<RuleName extends string>({ formElement, onChange }: InputQuestionProps<RuleName>) {
  const { question } = usePublicodesRuleTranslation(formElement.id) && { question: formElement.label }
  return (
    <Box key={formElement.id} className="mb2">
      <QuestionContainer label={question ?? formElement.label ?? formElement.id}>
        <PublicodesInputField formElement={formElement} onChange={onChange} />
      </QuestionContainer>
    </Box>
  )
}
