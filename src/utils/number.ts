import Big from 'big.js'

export const formatNumber = (value: number, dec = 2) =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec })

export const displayCA = (ca: number, factor: number) => new Big(ca).div(factor).toNumber()
