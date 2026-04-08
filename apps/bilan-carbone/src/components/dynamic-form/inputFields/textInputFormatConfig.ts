import { NumberInputFormat, TextInputFormat } from '../types/questionTypes'

export interface InputFormatConfig {
  inputProps: {
    type?: string
    inputMode?: 'text' | 'numeric' | 'tel'
    maxLength?: number
    pattern?: string
    step?: string
  }
}

export const INPUT_FORMAT_CONFIG: Record<TextInputFormat | NumberInputFormat, InputFormatConfig> = {
  [TextInputFormat.Text]: {
    inputProps: {},
  },
  [TextInputFormat.Phone]: {
    inputProps: {
      type: 'tel',
    },
  },
  [NumberInputFormat.Number]: {
    inputProps: {
      type: 'number',
      inputMode: 'numeric',
      step: 'any',
    },
  },
  [NumberInputFormat.PostalCode]: {
    inputProps: {
      type: 'text',
      inputMode: 'numeric',
      maxLength: 5,
      pattern: '[0-9]{5}',
    },
  },
}

export const getInputFormatConfig = (format: TextInputFormat | NumberInputFormat): InputFormatConfig => {
  return INPUT_FORMAT_CONFIG[format] || INPUT_FORMAT_CONFIG[TextInputFormat.Text]
}
