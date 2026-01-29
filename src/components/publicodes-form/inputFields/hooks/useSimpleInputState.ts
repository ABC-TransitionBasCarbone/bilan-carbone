import { EvaluatedNumberInput, EvaluatedStringInput } from '@publicodes/forms'
import { useCallback, useEffect, useRef, useState } from 'react'
import { OnFieldChange } from '../../utils'

export function useSimpleInputState<T extends string | number>(
  formElement: EvaluatedNumberInput | EvaluatedStringInput,
  onChange: OnFieldChange,
) {
  const externalValue = (formElement.value ?? formElement.defaultValue ?? null) as T | null
  const [localValue, setLocalValue] = useState<T | null>(externalValue)
  const lastCommittedValueRef = useRef<T | null>(externalValue)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (!isEditing && externalValue !== lastCommittedValueRef.current) {
      setLocalValue(externalValue)
      lastCommittedValueRef.current = externalValue
    }
  }, [externalValue, isEditing])

  const handleFocus = useCallback(() => setIsEditing(true), [])

  const handleValueChange = useCallback((newValue: T | null) => {
    setLocalValue(newValue)
  }, [])

  const handleValueCommitted = useCallback(
    (newValue: T | null) => {
      setIsEditing(false)
      lastCommittedValueRef.current = newValue
      onChange(formElement.id, newValue ?? undefined)
    },
    [onChange, formElement.id],
  )

  return {
    localValue,
    handleValueChange,
    handleValueCommitted,
    handleFocus,
  }
}
