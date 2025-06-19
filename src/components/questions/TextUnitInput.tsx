import { InputFormat } from '@/environments/cut/services/post'
import { TextFieldProps } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { InputHTMLAttributes, KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react'
import DebouncedInput from '../base/DebouncedInput'
import styles from './TextUnitInput.module.css'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  onUpdate: () => void
  format?: InputFormat
  unit?: string | null
}

const TextUnitInput = ({
  label,
  value,
  onChange,
  onUpdate,
  format,
  unit,
  ...props
}: Props & Omit<TextFieldProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) => {
  const tUnits = useTranslations('units')
  const [error, setError] = useState(false)

  const handleUpdate = useCallback(() => {
    if (onUpdate && !error) {
      onUpdate()
    }
  }, [onUpdate, error])

  useEffect(() => {
    switch (format) {
      case InputFormat.PostalCode:
        if (value.length > 0 && value.length !== 5) {
          setError(true)
        } else {
          setError(false)
        }
        break
      case InputFormat.Year:
        if (value.length > 0 && value.length !== 4) {
          setError(true)
        } else {
          setError(false)
        }
        break

      default:
        break
    }
  }, [format, value])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const isControlKey = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)
      const isDigit = /^\d$/.test(e.key)
      switch (format) {
        case InputFormat.Year:
        case InputFormat.PostalCode:
          if (!isDigit && !isControlKey) {
            e.preventDefault()
          }
          break

        default:
          break
      }
    },
    [format, value],
  )

  const inputProps: Omit<TextFieldProps & InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> = useMemo(() => {
    switch (format) {
      case InputFormat.PostalCode:
        return {
          inputMode: 'numeric',
          maxLength: 5,
          minLength: 5,
          onKeyDown: handleKeyDown,
        }
      case InputFormat.Year:
        return {
          inputMode: 'numeric',
          maxLength: 4,
          minLength: 4,
          onKeyDown: handleKeyDown,
        }
      case InputFormat.Number:
        return {
          type: 'number',
        }
      default:
        return {}
    }
  }, [format, value])

  return (
    <div className={classNames(styles.inputWithUnit, 'flex grow mr1')}>
      <DebouncedInput
        {...props}
        error={error}
        value={value}
        onChange={onChange}
        debounce={50}
        slotProps={{
          htmlInput: inputProps,
          input: {
            onWheel: (event) => (event.target as HTMLInputElement).blur(),
          },
          inputLabel: {
            shrink: true,
          },
        }}
        label={label}
        onBlur={handleUpdate}
      />
      {unit && <div className={styles.unit}>{tUnits(unit || '')}</div>}
    </div>
  )
}

export default TextUnitInput
