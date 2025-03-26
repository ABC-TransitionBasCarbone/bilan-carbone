import { SiteCAUnit } from '@prisma/client'
import Big from 'big.js'

export const formatNumber = (value: number, dec = 0) =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec })

export const displayCA = (ca: number, factor: number) => new Big(ca).div(factor).toNumber()

export const CA_UNIT_VALUES: Record<SiteCAUnit, number> = {
  U: 1,
  K: 1000,
  M: 1000000,
}

export const defaultCAUnit = CA_UNIT_VALUES[SiteCAUnit.K]
