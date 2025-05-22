'use client'

import { getFeaturesRestictions } from '@/db/deactivableFeatures'
import { FormControl, FormControlLabel, FormLabel, Switch } from '@mui/material'
import { Environment, UserSource } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  restrictions: AsyncReturnType<typeof getFeaturesRestictions>[number]
}

type RestrictionsTypes = UserSource | Environment

type Factor<TValue> = {
  title: string
  restrictions: TValue[]
  t: (value: string) => string
  values: TValue[]
  fn: (value: TValue, checked: boolean) => Promise<void>
}

const DeactivatedFeatureRestrictions = ({ restrictions }: Props) => {
  const t = useTranslations('deactivatedFeaturesRestrictions')
  const tFeatures = useTranslations('deactivableFeatures')
  const tSource = useTranslations('source')
  const tEnvironment = useTranslations('environment')
  const [error, setError] = useState('')
  const router = useRouter()

  const updateDeactivatedFeatureForSource = async (value: UserSource, checked: boolean) => {
    console.log('updateDeactivatedFeatureForSource : ', restrictions.feature, value, checked)
    setError('')
    router.refresh()
  }

  const updateDeactivatedFeatureForEnvironment = async (value: Environment, checked: boolean) => {
    console.log('updateDeactivatedFeatureForEnvironment : ', restrictions.feature, value, checked)
    setError('')
    router.refresh()
  }

  const factors: Array<Factor<UserSource> | Factor<Environment>> = [
    {
      title: 'source',
      restrictions: restrictions.sources,
      t: tSource,
      values: Object.values(UserSource),
      fn: updateDeactivatedFeatureForSource,
    },
    {
      title: 'environment',
      restrictions: restrictions.environments,
      t: tEnvironment,
      values: Object.values(Environment),
      fn: updateDeactivatedFeatureForEnvironment,
    },
  ]

  const isValueAllowed = (restrictions: RestrictionsTypes[], value: RestrictionsTypes) =>
    !restrictions.length || (typeof restrictions[0] === typeof value && !restrictions.includes(value))

  return (
    <>
      <h4 className="mt2 flex-col">{tFeatures(restrictions.feature)}</h4>
      {factors.map(({ title, t: tFactor, values, restrictions, fn }) => (
        <div className="flex align-center" key={title}>
          {t(title)} :
          {(values as typeof restrictions).map((value) => (
            <div key={value} className="ml2">
              <FormControl className="flex-row align-center" sx={{ gap: 1 }}>
                <FormLabel>{tFactor(value)}</FormLabel>
                <FormControlLabel
                  control={
                    <Switch
                      aria-label={t(isValueAllowed(restrictions, value).toString())}
                      checked={isValueAllowed(restrictions, value)}
                      onChange={(event) => (fn as Factor<RestrictionsTypes>['fn'])(value, event.target.checked)}
                    />
                  }
                  label={t(isValueAllowed(restrictions, value).toString())}
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
