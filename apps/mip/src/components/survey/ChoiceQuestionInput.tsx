import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  Radio,
  RadioGroup,
} from '@mui/material'
import { ChoiceQuestion } from '@repo/survey'

interface ChoiceQuestionInputProps {
  question: ChoiceQuestion
  value: string | string[] | undefined
  onChange: (value: string | string[]) => void
  error?: string | null
}

export function ChoiceQuestionInput({
  question,
  value,
  onChange,
  error,
}: ChoiceQuestionInputProps) {
  const selectedValue = typeof value === 'string' ? value : value?.[0] || ''

  return (
    <FormControl fullWidth error={!!error}>
      <RadioGroup
        value={selectedValue}
        onChange={(e) => onChange(e.target.value)}
      >
        {question.options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            control={<Radio />}
            label={option.label}
          />
        ))}
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  )
}
