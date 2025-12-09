import { EvaluatedFormElement } from '@publicodes/forms'
import RadioGroupInput from './inputFields/RadioGroupInput'
import SelectInput from './inputFields/SelectInput'
import TextWithUnitInput from './inputFields/TextWithUnitInput'
import YearPickerInput from './inputFields/YearPickerInput'
import { OnFieldChange } from './utils'

export interface PublicodesInputFieldProps<RuleName extends string> {
  formElement: EvaluatedFormElement<RuleName>
  onChange: OnFieldChange<RuleName>
}

export default function InputField<RuleName extends string>({
  formElement,
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
          return <TextWithUnitInput formElement={formElement} onChange={onChange} />
        // TODO: handle month type properly
        // case 'month':
        case 'date':
          return <YearPickerInput formElement={formElement} onChange={onChange} />
        case 'text':
          return formElement.defaultValue ? <p dangerouslySetInnerHTML={{ __html: formElement.defaultValue }} /> : null
        case 'checkbox':
        default:
          return <p>Unsupported input type: {formElement.type}</p>
      }
    case 'RadioGroup':
      return <RadioGroupInput formElement={formElement} onChange={onChange} />
    case 'select':
      return <SelectInput formElement={formElement} onChange={onChange} />
    case 'textarea':
    default:
      return <p>Unsupported formElement type: {formElement.element}</p>
  }
}
