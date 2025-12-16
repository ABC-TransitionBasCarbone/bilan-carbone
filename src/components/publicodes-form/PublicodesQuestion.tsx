import Box from '@mui/material/Box'
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
  switch (formLayout.type) {
    case 'input': {
      const formElement = formLayout.evaluatedElement

      return (
        <Box key={formElement.id} className="mb2">
          <QuestionContainer label={formElement.label} helperText={formElement.description}>
            <PublicodesInputField formElement={formElement} onChange={onChange} />
          </QuestionContainer>
        </Box>
      )
    }
    case 'group': {
      return (
        // TODO: handle helper text for layouts
        <QuestionContainer label={formLayout.title}>
          <GroupQuestion groupLayout={formLayout} onChange={onChange} />
        </QuestionContainer>
      )
    }
    case 'table': {
      return (
        // TODO: manage helper text for table
        <QuestionContainer label={formLayout.title}>
          <TableQuestion tableLayout={formLayout} onChange={onChange} />
        </QuestionContainer>
      )
    }
  }
}
