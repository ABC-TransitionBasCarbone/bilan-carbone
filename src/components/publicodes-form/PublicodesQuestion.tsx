import Box from '@mui/material/Box'
import { useTranslations } from 'next-intl'
import GroupQuestion from './GroupQuestion'
import PublicodesInputField from './InputField'
import { EvaluatedFormLayout } from './layouts/evaluatedFormLayout'
import QuestionContainer from './QuestionContainer'
import TableQuestion from './TableQuestion'
import { OnFieldChange } from './utils'

export interface PublicodesQuestionProps<RuleName extends string> {
  formLayout: EvaluatedFormLayout<RuleName>
  onChange: OnFieldChange<RuleName>
}

export default function PublicodesQuestion<RuleName extends string>({
  formLayout,
  onChange,
}: PublicodesQuestionProps<RuleName>) {
  const tInput = useTranslations('publicodes-rules')
  const tLayout = useTranslations('publicodes-layout')

  switch (formLayout.type) {
    case 'input': {
      const formElement = formLayout.evaluatedElement

      const translationKey = formElement.id.replace(/\s+.\s+/g, '.')

      return (
        <Box key={formElement.id} className="mb2">
          <QuestionContainer
            label={tInput(`${translationKey}.question`)}
            helperText={
              tInput.has(`${translationKey}.description`) ? tInput(`${translationKey}.description`) : undefined
            }
          >
            <PublicodesInputField formElement={formElement} onChange={onChange} />
          </QuestionContainer>
        </Box>
      )
    }
    case 'group': {
      return (
        // TODO: handle helper text for layouts
        <QuestionContainer label={tLayout(`group.${formLayout.title}`)}>
          <GroupQuestion groupLayout={formLayout} onChange={onChange} />
        </QuestionContainer>
      )
    }
    case 'table': {
      return (
        // TODO: manage helper text for table
        <QuestionContainer label={tLayout(`table.${formLayout.title}`)}>
          <TableQuestion tableLayout={formLayout} onChange={onChange} />
        </QuestionContainer>
      )
    }
  }
}
