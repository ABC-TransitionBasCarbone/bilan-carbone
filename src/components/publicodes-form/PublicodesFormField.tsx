import { EvaluatedFormElement, FormPageElementProp } from '@publicodes/forms'
import RadioGroupInput from './inputFields/RadioGroupInput'
import SelectInput from './inputFields/SelectInput'
import TextWithUnitInput from './inputFields/TextWithUnitInput'
import QuestionContainer from './QuestionContainer'
import { OnFormInputChange } from './utils'

export interface PublicodesFormFieldProps<RuleName extends string> {
  formElement: EvaluatedFormElement<RuleName> & FormPageElementProp
  onChange: OnFormInputChange<RuleName>
}

/**
 * A generic form field component that renders different types of input fields
 * based on the provided {@link EvaluatedFormElement}.
 */
export default function PublicodesFormField<RuleName extends string>({
  formElement,
  onChange,
}: PublicodesFormFieldProps<RuleName>) {
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

/**
 * Maps an {@link EvaluatedFormElement} to the corresponding input component.
 */
function getFieldInput<RuleName extends string>(
  formElement: EvaluatedFormElement<RuleName>,
  formElementProps: FormPageElementProp,
  onChange: OnFormInputChange<RuleName>,
) {
  /* eslint-disable no-fallthrough */
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
          return <p>Unsupported input type: {formElement.type}</p>
      }
    case 'RadioGroup':
      return <RadioGroupInput formElement={formElement} formElementProps={formElementProps} onChange={onChange} />
    case 'select':
      return <SelectInput formElement={formElement} formElementProps={formElementProps} onChange={onChange} />
    case 'textarea':
    default:
      return <p>Unsupported formElement type: {formElement.element}</p>
  }
}
