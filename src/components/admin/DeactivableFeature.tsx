'use client'

import { getFeaturesRestictions, RestrictionsTypes } from '@/db/deactivableFeatures'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  changeDeactivableFeatureRestriction,
  changeDeactivableFeatureStatus,
} from '@/services/serverFunctions/deactivableFeatures'
import { FormControl, FormControlLabel, FormLabel, Switch } from '@mui/material'
import { Environment, UserSource } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'

interface Props {
  restrictions: AsyncReturnType<typeof getFeaturesRestictions>[number]
}

type DeactivationCriteria<TValue> = {
  title: string
  criterias: TValue[]
  t: (value: string) => string
  values: TValue[]
}

const DeactivableFeature = ({ restrictions }: Props) => {
  const t = useTranslations('deactivableFeatures')
  const tSource = useTranslations('source')
  const tEnvironment = useTranslations('environment')
  const { callServerFunction } = useServerFunction()
  const router = useRouter()

  const changeFeatureStatus = async (status: boolean) => {
    await callServerFunction(() => changeDeactivableFeatureStatus(restrictions.feature, status), {
      onSuccess: () => {
        router.refresh()
      },
    })
  }

  const updateDeactivatedFeatureRestrictions = async (value: RestrictionsTypes, checked: boolean) => {
    await callServerFunction(() => changeDeactivableFeatureRestriction(restrictions.feature, value, !checked), {
      onSuccess: () => {
        router.refresh()
      },
    })
  }

  const featureDeactivationCriterias: Array<DeactivationCriteria<UserSource> | DeactivationCriteria<Environment>> = [
    {
      title: 'source',
      criterias: restrictions.deactivatedSources,
      t: tSource,
      values: Object.values(UserSource),
    },
    {
      title: 'environment',
      criterias: restrictions.deactivatedEnvironments,
      t: tEnvironment,
      values: Object.values(Environment),
    },
  ]

  const isCriteriaActive = (criterias: RestrictionsTypes[], value: RestrictionsTypes) =>
    (criterias && !criterias.length) || !criterias.includes(value)

  return (
    <>
      <div className="mt2 align-center">
        <h4 className="flex-col mr1">{t(restrictions.feature)}</h4>
        <FormControl>
          <FormControlLabel
            control={
              <Switch
                aria-label={t(restrictions.active.toString())}
                checked={restrictions.active}
                onChange={(event) => changeFeatureStatus(event.target.checked)}
              />
            }
            label={t(restrictions.active.toString())}
          />
        </FormControl>
      </div>
      {featureDeactivationCriterias.map(({ title, t: tFactor, values, criterias }) => (
        <div className="wrap align-center" key={title}>
          {t(title)} :
          {(values as typeof criterias).map((value) => (
            <div key={value} className="ml2">
              <FormControl className="flex-row align-center" sx={{ gap: 1 }}>
                <FormLabel>{tFactor(value)}</FormLabel>
                <FormControlLabel
                  control={
                    <Switch
                      aria-label={t(isCriteriaActive(criterias, value).toString())}
                      checked={isCriteriaActive(criterias, value)}
                      onChange={(event) => updateDeactivatedFeatureRestrictions(value, event.target.checked)}
                    />
                  }
                  disabled={!restrictions.active}
                  label={t(isCriteriaActive(criterias, value).toString())}
                />
              </FormControl>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}

export default DeactivableFeature
