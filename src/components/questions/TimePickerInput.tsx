import { TimePicker, TimePickerProps } from '@mui/x-date-pickers'
import { InputHTMLAttributes } from 'react'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  onUpdate: () => void
  unit?: string | null
}

const TimePickerInput = ({
  label,
  value,
  onChange,
  onUpdate,
  unit,
  ...props
}: Props & Omit<TimePickerProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) => {
  return <TimePicker onChange={(value) => onChange(value?.toString() || '')} onAccept={onUpdate} {...props} />
}

export default TimePickerInput
