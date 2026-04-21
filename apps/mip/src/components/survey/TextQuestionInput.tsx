/**
 * Text Question Input Component
 */

import { FormControl, FormHelperText, TextField } from '@mui/material'
import { TextQuestion } from '@repo/survey'

interface TextQuestionInputProps {
  question: TextQuestion
  value: string
  onChange: (value: string) => void
  error?: string | null
}

export function TextQuestionInput({
  question,
  value,
  onChange,
  error,
}: TextQuestionInputProps) {
  return (
    <FormControl fullWidth error={!!error}>
      <TextField
        fullWidth
        multiline
        rows={4}
        placeholder={question.placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error}
        inputProps={{
          maxLength: question.validation?.maxLength,
        }}
      />
      {question.validation?.maxLength && (
        <FormHelperText>
          {value?.length || 0} / {question.validation.maxLength} characters
        </FormHelperText>
      )}
    </FormControl>
  )
}
