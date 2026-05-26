import { Typography } from '@mui/material'

const formatRatePercent = (rate: number, locale = 'fr-FR') => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumSignificantDigits: 2,
    minimumSignificantDigits: 2,
  }).format(rate)
}

export const getDisplayedRates = (
  locale = 'fr-FR',
  referenceRate: number | undefined,
  correctedRate: number | undefined,
) => {
  const reference = referenceRate !== undefined ? `-${formatRatePercent(referenceRate, locale)}` : null
  const corrected = correctedRate !== undefined ? `-${formatRatePercent(correctedRate, locale)}` : null

  return (
    <>
      {reference}
      {corrected && (
        <>
          {' '}
          /{' '}
          <Typography component="span" color="warning.main">
            {corrected}
          </Typography>
        </>
      )}
    </>
  )
}
