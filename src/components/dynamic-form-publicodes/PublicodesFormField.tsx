import { EvaluatedFormElement, FormPageElementProp } from '@publicodes/forms'
import TextWithUnitInput from './inputFields/TextWithUnitInput'
import QuestionContainer from './QuestionContainer'
import { OnFormInputChange } from './utils'

export interface PublicodesFormFieldProps {
  formElement: EvaluatedFormElement & FormPageElementProp
  onChange: OnFormInputChange
}

export default function PublicodesFormField({ formElement, onChange }: PublicodesFormFieldProps) {
  const formElementProps = {
    hidden: formElement.hidden,
    useful: formElement.useful,
    disabled: formElement.disabled,
    autofocus: formElement.autofocus,
    required: formElement.required,
  }
  return (
    <QuestionContainer label={formElement.label} helperText={formElement.description}>
      {getFieldInput(formElement, formElementProps, onChange)}
    </QuestionContainer>
  )
}

function getFieldInput(
  formElement: EvaluatedFormElement,
  formElementProps: FormPageElementProp,
  onChange: OnFormInputChange,
) {
  switch (formElement.element) {
    case 'input':
      switch (formElement.type) {
        case 'number':
          return <TextWithUnitInput formElement={formElement} formElementProps={formElementProps} onChange={onChange} />
        // TODO: handle month type properly
        case 'month':
        case 'date':
        case 'checkbox':
        case 'text':
        default:
      }
    case 'RadioGroup':
    case 'select':
    case 'textarea':
    default:
      return <p>Unsupported formElement type: {formElement.element}</p>
  }
}
