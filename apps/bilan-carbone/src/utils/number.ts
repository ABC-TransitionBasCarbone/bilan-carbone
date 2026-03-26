import { SiteCAUnit } from '@prisma/client'
import Big from 'big.js'

export const formatNumber = (value?: number, dec = 0) =>
  (value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec })

export const parseFloatString = (value: string): number | undefined => {
  if (!value || value.trim() === '') {
    return undefined
  }

  const normalizedValue = value.replace(',', '.')
  const parsed = parseFloat(normalizedValue)

  if (isNaN(parsed)) {
    return undefined
  }

  return parsed
}

const countZerosAfterDecimal = (value: number): number => {
  if (value >= 1 || value <= -1) {
    return 0
  }

  const fixed = value.toFixed(20) // fix value to avoid exponential annotation e^
  const match = fixed.match(/^0\.0*(?=\d)/)
  return match ? match[0].length - 2 : 0
}

export const formatEmissionFactorNumber = (value: number): string => {
  if (Number.isInteger(value)) {
    return value.toString()
  }

  const integerPart = Math.floor(value)

  if (integerPart > 9 || integerPart < -9) {
    return formatNumber(value)
  }

  if (integerPart >= 1 || integerPart <= -1) {
    return formatNumber(value, 1)
  }

  return formatNumber(value, countZerosAfterDecimal(value) + 2)
}

export const displayCA = (ca: number, factor: number) => new Big(ca).div(factor).toNumber()

export const CA_UNIT_VALUES: Record<SiteCAUnit, number> = {
  U: 1,
  K: 1000,
  M: 1000000,
}

export const defaultCAUnit = SiteCAUnit.K
