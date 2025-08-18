import { formatNumber } from './number'

export const formatValueAndUnit = (value: number | null, unit?: string) => {
  const safeValue = value ?? 0
  const unitToDisplay = unit ?? ''
  return `${formatNumber(safeValue, 2)} ${unitToDisplay}`
}
