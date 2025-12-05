import { EvaluatedFormElement, FormPageElementProp } from '@publicodes/forms'
import RadioGroupInput from './inputFields/RadioGroupInput'
import SelectInput from './inputFields/SelectInput'
import TextWithUnitInput from './inputFields/TextWithUnitInput'
import YearPickerInput from './inputFields/YearPickerInput'
import { OnFormInputChange } from './utils'

export interface PublicodesInputFieldProps<RuleName extends string> {
  formElement: EvaluatedFormElement<RuleName>
  formElementProps: FormPageElementProp
  onChange: OnFormInputChange<RuleName>
}

export default function InputField<RuleName extends string>({
  formElement,
  formElementProps,
  onChange,
}: PublicodesInputFieldProps<RuleName>) {
  /*
   * TODO: to check if we want to support more input types in the future
   * eslint-disable no-fallthrough
   */
  switch (formElement.element) {
    case 'input':
      switch (formElement.type) {
        case 'number':
          return <TextWithUnitInput formElement={formElement} formElementProps={formElementProps} onChange={onChange} />
        // TODO: handle month type properly
        // case 'month':
        case 'date':
          return <YearPickerInput formElement={formElement} formElementProps={formElementProps} onChange={onChange} />
        case 'text':
          return formElement.defaultValue ? <p dangerouslySetInnerHTML={{ __html: formElement.defaultValue }} /> : null
        case 'checkbox':
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
