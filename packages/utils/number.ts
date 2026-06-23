export const formatNumber = (value?: number, dec = 0) =>
  (value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: dec })
