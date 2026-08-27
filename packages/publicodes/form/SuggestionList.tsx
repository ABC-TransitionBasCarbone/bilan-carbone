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
            {suggestions.map(([label, value]) => (
                <button key={label} type="button" className={buttonClassName} onClick={() => onSelect(label, value)}>
                    {label}
                </button>
            ))}
        </div>
    )
}
