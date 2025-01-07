export const formatNumber = (value: number, dec = 2) =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec })
