'use client'

import { getFeaturesRestictions, RestrictionsTypes } from '@/db/deactivableFeatures'
import { changeDeactivableFeatureRestriction } from '@/services/serverFunctions/deactivableFeatures'
import { FormControl, FormControlLabel, FormLabel, Switch } from '@mui/material'
import { Environment, UserSource } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  restrictions: AsyncReturnType<typeof getFeaturesRestictions>[number]
}

type Factor<TValue> = {
  title: string
  factorRestrictions: TValue[]
  t: (value: string) => string
  values: TValue[]
}

const DeactivatedFeatureRestrictions = ({ restrictions }: Props) => {
  const t = useTranslations('deactivatedFeaturesRestrictions')
  const tFeatures = useTranslations('deactivableFeatures')
  const tSource = useTranslations('source')
  const tEnvironment = useTranslations('environment')
  const [error, setError] = useState('')
  const router = useRouter()

  const updateDeactivatedFeatureRestrictions = async (value: RestrictionsTypes, checked: boolean) => {
    setError('')
    const result = await changeDeactivableFeatureRestriction(restrictions.feature, value, !checked)
    if (!result.success) {
      setError(result.errorMessage)
    } else {
      router.refresh()
    }
  }

  const factors: Array<Factor<UserSource> | Factor<Environment>> = [
    {
      title: 'source',
      factorRestrictions: restrictions.deactivatedSources,
      t: tSource,
      values: Object.values(UserSource),
    },
    {
      title: 'environment',
      factorRestrictions: restrictions.deactivatedEnvironments,
      t: tEnvironment,
      values: Object.values(Environment),
    },
  ]

  const isValueAllowed = (factorRestrictions: RestrictionsTypes[], value: RestrictionsTypes) =>
    (factorRestrictions && !factorRestrictions.length) ||
    (typeof factorRestrictions[0] === typeof value && !factorRestrictions.includes(value))

  return (
    <>
      <h4 className="mt2 flex-col">{tFeatures(restrictions.feature)}</h4>
      {factors.map(({ title, t: tFactor, values, factorRestrictions }) => (
        <div className="wrap align-center" key={title}>
          {t(title)} :
          {(values as typeof factorRestrictions).map((value) => (
            <div key={value} className="ml2">
              <FormControl className="flex-row align-center" sx={{ gap: 1 }}>
                <FormLabel>{tFactor(value)}</FormLabel>
                <FormControlLabel
                  control={
                    <Switch
                      aria-label={t(isValueAllowed(factorRestrictions, value).toString())}
                      checked={isValueAllowed(factorRestrictions, value)}
                      onChange={(event) => updateDeactivatedFeatureRestrictions(value, event.target.checked)}
                    />
                  }
                  disabled={!restrictions.active}
                  label={t(isValueAllowed(factorRestrictions, value).toString())}
                />
              </FormControl>
            </div>
          ))}
        </div>
      ))}
      {error && <p className="error">{t(error)}</p>}
    </>
  )
}

export default DeactivatedFeatureRestrictions
