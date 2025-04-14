import { SiteCAUnit } from '@prisma/client'
import Big from 'big.js'

export const formatNumber = (value: number, dec = 0) =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec })

const countZerosAfterDecimal = (value: number): number => {
  if (value >= 1 || value <= 0) {
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
  const decimalPart = value.toString().split('.')[1] ?? ''

  if (integerPart > 9) {
    return formatNumber(value)
  }

  if (decimalPart.length === 2) {
    return formatNumber(value, integerPart === 0 ? 2 : 1)
  }
  return formatNumber(value, value >= 0.1 ? 2 : countZerosAfterDecimal(value) + 2)
}

export const displayCA = (ca: number, factor: number) => new Big(ca).div(factor).toNumber()

export const CA_UNIT_VALUES: Record<SiteCAUnit, number> = {
  U: 1,
  K: 1000,
  M: 1000000,
}

export const defaultCAUnit = CA_UNIT_VALUES[SiteCAUnit.K]
