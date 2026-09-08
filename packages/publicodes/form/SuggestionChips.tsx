import classNames from 'classnames'
import { BaseStyledChip } from '@abc-transitionbascarbone/ui'
import { getCategoryClassSuffix, getRuleCategoryKey } from './utils'
import styles from './SuggestionChips.module.css'

export type SuggestionChipOption<TValue> = {
  label: string
  value: TValue
}

interface SuggestionChipsProps<TValue> {
  ruleName: string
  suggestions: SuggestionChipOption<TValue>[]
  onSelect: (value: TValue) => void
  isSelected?: (suggestion: SuggestionChipOption<TValue>) => boolean
}

export const SuggestionChips = <TValue,>({
  ruleName,
  suggestions,
  onSelect,
  isSelected,
}: SuggestionChipsProps<TValue>) => {
  if (suggestions.length === 0) {
    return null
  }

  const categoryClassSuffix = getCategoryClassSuffix(getRuleCategoryKey(ruleName))
  const suggestionToneClass = categoryClassSuffix ? styles[`suggestionTone${categoryClassSuffix}`] : undefined

  return (
    <div className={classNames('flex', 'wrap', 'gapped-2', 'pb-2', 'mt1')} data-testid="survey-suggestions">
      {suggestions.map((suggestion, index) => (
        <BaseStyledChip
          key={suggestion.label}
          label={suggestion.label}
          clickable
          onClick={() => onSelect(suggestion.value)}
          className={classNames(styles.suggestionChip, suggestionToneClass, 'pointer', {
            [styles.selectedSuggestionChip]: isSelected?.(suggestion) ?? false,
          })}
          data-testid={`survey-suggestion-${index + 1}`}
        />
      ))}
    </div>
  )
}
