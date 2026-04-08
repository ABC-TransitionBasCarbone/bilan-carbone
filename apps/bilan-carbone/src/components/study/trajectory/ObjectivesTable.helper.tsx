import { formatNumber } from '@/utils/number'
import { Typography } from '@mui/material'

export const getDisplayedRates = (referenceRate: number | undefined, correctedRate: number | undefined) => {
  const reference = referenceRate ? `-${formatNumber(referenceRate * 100, 1)}%` : null
  const corrected = correctedRate ? `-${formatNumber(correctedRate * 100, 1)}%` : null

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
