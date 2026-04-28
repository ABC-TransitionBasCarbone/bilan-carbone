import { FormControl, FormHelperText, TextField } from '@mui/material'
import { TextQuestion } from '@repo/survey'
import { useTranslations } from 'next-intl'

interface TextQuestionInputProps {
  question: TextQuestion
  value: string
  onChange: (value: string) => void
  error?: string | null
}

export function TextQuestionInput({ question, value, onChange, error }: TextQuestionInputProps) {
  const t = useTranslations('survey')

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
        slotProps={{
          htmlInput: {
            maxLength: question.validation?.maxLength,
          },
        }}
      />
      {question.validation?.maxLength && (
        <FormHelperText>
          {t('characterCount', {
            current: value?.length || 0,
            max: question.validation.maxLength,
          })}
        </FormHelperText>
      )}
    </FormControl>
  )
}
