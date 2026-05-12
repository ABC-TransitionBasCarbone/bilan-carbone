import { EvaluatedFormElement } from '@publicodes/forms'
import { OnFieldChange } from '../utils'

/**
 * Props shared by all form input components of the {@link PublicodesFormField}.
 */
export interface BaseInputProps<RuleName extends string> {
  /** The evaluated form element to render returned by the {@link FormBuilder}. */
  formElement: EvaluatedFormElement
  /** Callback invoked when the input value changes. */
  onChange: OnFieldChange<RuleName>
  onBlur?: () => void
  errorMessage?: string
  disabled?: boolean
}

/**
 * The supported input types for form elements.
 *
 * TODO: should be exported from @publicodes/forms
 */
export type InputType = 'date' | 'month' | 'checkbox' | 'number' | 'text'

export function getFormElementInputType(element: EvaluatedFormElement): InputType | undefined {
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
