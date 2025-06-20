import { FormControl, FormControlLabel, FormHelperText, Radio, RadioGroup } from '@mui/material'
import { useTranslations } from 'next-intl'
import { BaseInputProps } from '../dynamic-form/types/formTypes'

interface BooleanInputRHFProps extends BaseInputProps {
  label?: string
  trueLabel?: string
  falseLabel?: string
}

const BooleanInputRHF = ({
  question,
  value,
  onChange,
  onBlur,
  error,
  disabled,
  label,
  trueLabel = 'Yes',
  falseLabel = 'No',
}: BooleanInputRHFProps) => {
  const tQuestions = useTranslations('emissionFactors.post.cutQuestions')
  const tCommon = useTranslations('common')

  const inputLabel = label || tQuestions(question.idIntern)
  const yesLabel = trueLabel || tCommon('yes')
  const noLabel = falseLabel || tCommon('no')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value === 'true'
    onChange(newValue)
  }

  const handleBlur = () => {
    if (onBlur) {
      onBlur()
    }
  }

  return (
    <FormControl error={!!error} disabled={disabled}>
      <RadioGroup value={value === undefined ? '' : String(value)} onChange={handleChange} onBlur={handleBlur} row>
        <FormControlLabel value="true" control={<Radio />} label={yesLabel} />
        <FormControlLabel value="false" control={<Radio />} label={noLabel} />
      </RadioGroup>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  )
}

export default BooleanInputRHF
