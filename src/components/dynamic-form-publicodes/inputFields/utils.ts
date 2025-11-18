import { EvaluatedFormElement, FormPageElementProp } from '@publicodes/forms'
import { OnFormInputChange } from '../utils'

export interface BaseInputProps {
  formElement: EvaluatedFormElement
  formElementProps: FormPageElementProp
  onChange: OnFormInputChange
  onBlur?: () => void
  errorMessage?: string
  disabled?: boolean
}

export function getFormElementInputType(element: EvaluatedFormElement): string | undefined {
  if (element.element === 'input') {
    return element.type
  }
}

export function getFormElementValue(element: EvaluatedFormElement): string | number | undefined {
  if (element.element === 'input' && element.type === 'checkbox') {
    // TODO: should probably return a boolean instead
    return element.checked ? 'true' : 'false'
  }

  return element.value
}

export function getFormElementUnit(element: EvaluatedFormElement): string | undefined {
  if (element.element === 'input' && element.type === 'number') {
    return element.unit
  }
}
