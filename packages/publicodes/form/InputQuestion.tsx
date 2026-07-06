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
  const question = translation?.question

  const rawNode = engine?.getParsedRules()[formElement.id]?.rawNode as Record<string, unknown> | undefined
  const description = (rawNode?.description as string | undefined) ?? translation?.description
  const suggestions = rawNode?.suggestions as Record<string, number> | undefined

  return (
    <Box key={formElement.id} className="mb2">
      <QuestionContainer label={question ?? formElement.label ?? formElement.id} description={description}>
        <PublicodesInputField formElement={formElement} onChange={onChange} suggestions={suggestions} />
      </QuestionContainer>
    </Box>
  )
}
