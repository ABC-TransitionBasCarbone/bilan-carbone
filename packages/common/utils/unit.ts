// Predicate used to visually highlight unusual units in publicodes forms.
// The list of units to highlight is provided per environment (see HighlightedUnitsProvider).
export const isHighlightedUnit = (unit: string | undefined, highlightedUnits: readonly string[]): boolean =>
  !!unit && highlightedUnits.includes(unit.trim())
