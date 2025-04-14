'use client'

import { NOT_AUTHORIZED } from '@/services/permissions/check'
import { changeDeactivableFeatureStatus } from '@/services/serverFunctions/deactivableFeatures'
import { FormControl, FormControlLabel, FormLabel, Switch } from '@mui/material'
import { DeactivatableFeature } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type FeatureStatus = {
  id: string
  feature: DeactivatableFeature
  active: boolean
}

interface Props {
  featuresStatuses: FeatureStatus[]
}

const DeactivableFeatures = ({ featuresStatuses }: Props) => {
  const t = useTranslations('deactivableFeatures')
  const [error, setError] = useState('')
  const router = useRouter()

  const changeFeatureStatus = async (feature: DeactivatableFeature, status: boolean) => {
    setError('')
    const result = await changeDeactivableFeatureStatus(feature, status)
    if (result === NOT_AUTHORIZED) {
      setError(result)
    } else {
      router.refresh()
    }
  }

  return (
    <>
      <h3 className="mt2 flex-col">{t('title')} :</h3>
      {featuresStatuses.map((feature) => (
        <div key={feature.id} className="mt-2">
          <FormControl>
            <FormLabel>{t(feature.feature)}</FormLabel>
            <FormControlLabel
              control={
                <Switch
                  aria-label={t(feature.active.toString())}
                  checked={feature.active}
                  onChange={(event) => changeFeatureStatus(feature.feature, event.target.checked)}
                />
              }
              label={t(feature.active.toString())}
            />
          </FormControl>
        </div>
      ))}
      {error && <p className="error">{t(error)}</p>}
    </>
  )
}

export default DeactivableFeatures
