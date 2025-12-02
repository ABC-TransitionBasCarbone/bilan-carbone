import Box from '@mui/material/Box'
import { EvaluatedFormLayout } from '@publicodes/forms'
import GroupQuestion from './GroupQuestion'
import PublicodesInputField from './InputField'
import QuestionContainer from './QuestionContainer'
import TableQuestion from './TableQuestion'
import { OnFormInputChange } from './utils'

export interface PublicodesFormFieldProps<RuleName extends string> {
  formLayout: EvaluatedFormLayout<RuleName>
  onChange: OnFormInputChange<RuleName>
}

/**
 * A generic form field component that renders different types of input fields
 * based on the provided {@link EvaluatedFormElement}.
 */
export default function PublicodesFormField<RuleName extends string>({
  formLayout,
  onChange,
}: PublicodesFormFieldProps<RuleName>) {
  switch (formLayout.type) {
    case 'simple': {
      const formElement = formLayout.evaluatedElement
      const formElementProps = {
        hidden: formElement.hidden,
        useful: formElement.useful,
        disabled: formElement.disabled,
        autofocus: formElement.autofocus,
        required: formElement.required,
      }

      return (
        <Box key={formElement.id} sx={{ mb: 2 }}>
          <QuestionContainer label={formElement.label} helperText={formElement.description}>
            <PublicodesInputField formElement={formElement} formElementProps={formElementProps} onChange={onChange} />
          </QuestionContainer>
        </Box>
      )
    }
    case 'group': {
      return (
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
