/**
 * Returns an empty array if all values are selected, otherwise returns the selected values
 */
export const toScopedValues = <T,>(selected: T[], all: T[]) =>
  selected.length === all.length && all.every((v) => selected.includes(v)) ? [] : selected
