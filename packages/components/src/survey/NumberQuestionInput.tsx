import { NumberQuestion } from '@abc-transitionbascarbone/typeguards'
import MosaicNumberInput from '@abc-transitionbascarbone/ui/src/Form/MosaicNumberInput'
import { FormControl, FormHelperText } from '@mui/material'
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
      <MosaicNumberInput title="Test" icons="🍴" value={value} onChange={onChange} />
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
