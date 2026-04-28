import { FormControl, FormControlLabel, FormHelperText, Radio, RadioGroup } from '@mui/material'
import { ChoiceQuestion } from '@/types/survey'

interface ChoiceQuestionInputProps {
  question: ChoiceQuestion
  value: string | undefined
  onChange: (value: string | string[]) => void
  error?: string | null
}

export function ChoiceQuestionInput({ question, value, onChange, error }: ChoiceQuestionInputProps) {
  const selectedValue = value || ''

  return (
    <FormControl fullWidth error={!!error}>
      <RadioGroup value={selectedValue} onChange={(e) => onChange(e.target.value)}>
        {question.options.map((option) => (
          <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
        ))}
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  )
}
