import { EvaluatedNumberInput, EvaluatedStringInput } from '@publicodes/forms'
import { useCallback, useEffect, useRef, useState } from 'react'
import { OnFieldChange } from '../../utils'

export function useSimpleInputState<T extends string | number>(
  formElement: EvaluatedNumberInput | EvaluatedStringInput,
  onChange: OnFieldChange,
) {
  const externalValue = (formElement.value ?? formElement.defaultValue ?? null) as T | null
  // L'état local suit la valeur affichée dans l'input
  const [localValue, setLocalValue] = useState<T | null>(externalValue)
  const lastCommittedValueRef = useRef<T | null>(externalValue)
  const [isEditing, setIsEditing] = useState(false)

  // Synchroniser avec les changements externes uniquement
  useEffect(() => {
    if (!isEditing && externalValue !== lastCommittedValueRef.current) {
      setLocalValue(externalValue)
      lastCommittedValueRef.current = externalValue
      console.log('[useSimpleInputState] External value changed (sync) : ', { externalValue, formElement })
    }
  }, [externalValue, isEditing])

  const handleFocus = useCallback(() => setIsEditing(true), [])

  // L'utilisateur modifie la valeur (pas encore commitée)
  const handleValueChange = useCallback((newValue: T | null) => {
    setLocalValue(newValue)
  }, [])

  // L'utilisateur quitte le focus -> on commit
  const handleValueCommitted = useCallback(
    (newValue: T | null) => {
      setIsEditing(false)
      lastCommittedValueRef.current = newValue
      console.log(`[COMMIT] Demande de commit pour champ`, {
        champId: formElement.id,
        valeur: newValue,
      })
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
