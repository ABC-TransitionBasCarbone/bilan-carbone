import { NumberQuestion } from '@abc-transitionbascarbone/typeguards'
import { FormControl, FormHelperText, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'

interface NumberQuestionInputProps {
  question: NumberQuestion
  value: number
  onChange: (value: number) => void
  error?: string | null
}

export function NumberQuestionInput({ question, value, onChange, error }: NumberQuestionInputProps) {
  const t = useTranslations('survey')

  return (
    <FormControl fullWidth error={!!error}>
      <TextField
        type="number"
        fullWidth
        placeholder={question.placeholder}
        value={value || ''}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        error={!!error}
        helperText={error}
        slotProps={{
          htmlInput: {
            max: question.validation?.max,
            min: question.validation?.min,
            step: question.validation?.step,
          },
        }}
      />
      {question.validation?.max && (
        <FormHelperText>
          {t('characterCount', {
            current: value || 0,
            max: question.validation.max,
          })}
        </FormHelperText>
      )}
    </FormControl>
  )
}


