import { BaseStyledChip } from '@abc-transitionbascarbone/ui'

type SuggestionListProps<TValue> = {
    suggestions: [string, TValue][]
    onSelect: (label: string, value: TValue) => void
    containerClassName?: string
    buttonClassName?: string
}

export function SuggestionList<TValue>({
    suggestions,
    onSelect,
    containerClassName,
    buttonClassName,
}: SuggestionListProps<TValue>) {
    if (suggestions.length === 0) {
        return null
    }

    return (
        <div className={containerClassName}>
            {suggestions.map(([label, value], index) => (
                <BaseStyledChip
                    key={`${label}-${index}`}
                    clickable
                    className={buttonClassName}
                    label={label}
                    onClick={() => onSelect(label, value)}
                />
            ))}
        </div>
    )
}
