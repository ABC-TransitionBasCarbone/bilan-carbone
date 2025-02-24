'use client'

import { FullStudy } from '@/db/study'
import { getEmissionResults, getEmissionSourceCompletion } from '@/services/emissionSource'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { updateEmissionSource } from '@/services/serverFunctions/emissionSource'
import {
  UpdateEmissionSourceCommand,
  UpdateEmissionSourceCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { EmissionSourcesStatus, getEmissionSourceStatus } from '@/services/study'
import { getQualityRating, getStandardDeviationRating } from '@/services/uncertainty'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatNumber } from '@/utils/number'
import EditIcon from '@mui/icons-material/Edit'
import { Alert, CircularProgress, FormControlLabel, Switch } from '@mui/material'
import { EmissionSourceCaracterisation, Level, StudyRole } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Path } from 'react-hook-form'
import styles from './EmissionSource.module.css'
import EmissionSourceContributorForm from './EmissionSourceContributorForm'
import EmissionSourceForm from './EmissionSourceForm'

type StudyProps = {
  study: FullStudy
  emissionSource: FullStudy['emissionSources'][0]
  withoutDetail: false
}

type StudyWithoutDetailProps = {
  study: StudyWithoutDetail
  emissionSource: StudyWithoutDetail['emissionSources'][0]
  withoutDetail: true
}

interface Props {
  emissionFactors: EmissionFactorWithMetaData[]
  userRoleOnStudy: StudyRole | null
  caracterisations: EmissionSourceCaracterisation[]
}

const EmissionSource = ({
  study,
  emissionSource,
  emissionFactors,
  userRoleOnStudy,
  withoutDetail,
  caracterisations,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const tError = useTranslations('error')
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')
  const tQuality = useTranslations('quality')
  const router = useRouter()
  const [display, setDisplay] = useState(false)

  const detailId = `${emissionSource.id}-detail`
  const canEdit = !emissionSource.validated && userRoleOnStudy !== StudyRole.Reader
  const canValidate = userRoleOnStudy === StudyRole.Validator

  const update = useCallback(
    async (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean) => {
      if (key) {
        if (value === emissionSource[key as keyof typeof emissionSource]) {
          return
        }
        setError('')
        setLoading(true)
        try {
          const command = {
            emissionSourceId: emissionSource.id,
            [key]: value,
          }
          const isValid = UpdateEmissionSourceCommandValidation.safeParse(command)
          if (isValid.success) {
            const result = await updateEmissionSource(isValid.data)
            if (result) {
              setError(result)
            }
            setLoading(false)
            router.refresh()
          }
        } catch {
          setError('default')
        } finally {
          setLoading(false)
        }
      }
    },
    [emissionSource, router],
  )

  useEffect(() => {
    if (ref.current) {
      if (display) {
        const height = ref.current.scrollHeight
        ref.current.style.height = `${height}px`

        setTimeout(() => {
          if (ref.current) {
            ref.current.style.height = 'auto'
            ref.current.style.overflow = 'visible'
          }
        }, 500)
      } else {
        ref.current.style.height = '0px'
        ref.current.style.overflow = 'hidden'
      }
    }
  }, [display, ref])

  const selectedFactor = useMemo(() => {
    if (emissionSource.emissionFactor) {
      return emissionFactors.find((emissionFactor) => emissionFactor.id === emissionSource.emissionFactor?.id)
    }
  }, [emissionSource.emissionFactor, emissionFactors])

  const status = useMemo(() => getEmissionSourceStatus(study, emissionSource), [study, emissionSource])
  const sourceRating = useMemo(() => getQualityRating(emissionSource), [emissionSource])
  const emissionResults = useMemo(() => getEmissionResults(emissionSource), [emissionSource])
  const selectedFactorQualityRating = useMemo(
    () => (selectedFactor ? getQualityRating(selectedFactor) : null),
    [selectedFactor],
  )

  return (
    <div className={styles.container}>
      <button
        data-testid={`emission-source-${emissionSource.name}`}
        className={classNames(styles.line, 'justify-between', 'align-center')}
        aria-expanded={display}
        aria-controls={detailId}
        onClick={() => setDisplay(!display)}
      >
        <div className={classNames(styles.infosLeft, 'flex-col')}>
          <p>{emissionSource.name}</p>
          {emissionSource.contributor && (
            <p data-testid="emission-source-contributor" className={styles.status}>
              {emissionSource.contributor.email}
            </p>
          )}
          <p data-testid="emission-source-status" className={classNames(styles.status, 'align-center')}>
            {t(`status.${status}`)}
            {(status === EmissionSourcesStatus.Waiting || status === EmissionSourcesStatus.WaitingContributor) && (
              <>
                {' '}
                -{' '}
                {formatNumber(getEmissionSourceCompletion(emissionSource, study, emissionSource.emissionFactor) * 100)}%
              </>
            )}
            {loading && (
              <>
                {' '}
                - {t('saving')} <CircularProgress size="1rem" />
              </>
            )}
          </p>
        </div>
        <div className={classNames(styles.infosRight, 'flex')}>
          <div className="flex-col">
            {typeof emissionSource.value === 'number' && emissionSource.value !== 0 && (
              <>
                <p>
                  {formatNumber(emissionSource.value, 5)} {selectedFactor && tUnits(selectedFactor.unit)}
                </p>
                {sourceRating && (
                  <p className={styles.status}>
                    {tQuality('name')} {tQuality(sourceRating.toString())}
                  </p>
                )}
              </>
            )}
          </div>
          <div className="flex-col">
            {selectedFactor && (
              <>
                <p>
                  {selectedFactor.metaData?.title}
                  {selectedFactor.location ? ` - ${selectedFactor.location}` : ''}
                  {selectedFactor.metaData?.location ? ` - ${selectedFactor.metaData.location}` : ''} -{' '}
                  {getEmissionFactorValue(selectedFactor) / 1000} tCO₂e/
                  {tUnits(selectedFactor.unit)}
                </p>
                {selectedFactorQualityRating && (
                  <p className={styles.status}>
                    {tQuality('name')} {tQuality(selectedFactorQualityRating.toString())}
                  </p>
                )}
              </>
            )}
          </div>
          {emissionResults && (
            <div className="flex-col">
              <p data-testid="emission-source-value">{`${formatNumber(emissionResults.emission / 1000)} tCO₂e`}</p>
              {emissionResults.standardDeviation && (
                <p className={styles.status} data-testid="emission-source-quality">
                  {tQuality('name')}{' '}
                  {tQuality(getStandardDeviationRating(emissionResults.standardDeviation).toString())}
                </p>
              )}
            </div>
          )}
        </div>
        <div className={styles.editIcon}>
          <EditIcon />
        </div>
      </button>
      <div id={detailId} className={classNames(styles.detail, { [styles.displayed]: display })} ref={ref}>
        {display && (
          <div className={styles.detailContent}>
            {error && (
              <Alert className="mb1" severity="error">
                {tError(error)}
              </Alert>
            )}
            <div className="justify-between align-center">
              <p>{t('informations')}</p>
              <div>
                {!withoutDetail &&
                  canValidate &&
                  status !== EmissionSourcesStatus.Waiting &&
                  status !== EmissionSourcesStatus.WaitingContributor && (
                    <FormControlLabel
                      control={
                        <Switch
                          data-testid="emission-source-validated"
                          checked={emissionSource.validated || false}
                          onChange={(event) => update('validated', event.target.checked)}
                        />
                      }
                      label={t('form.validate')}
                      labelPlacement="start"
                    />
                  )}
              </div>
            </div>
            {withoutDetail ? (
              <EmissionSourceContributorForm
                emissionSource={emissionSource}
                selectedFactor={selectedFactor}
                emissionFactors={emissionFactors}
                update={update}
              />
            ) : (
              <EmissionSourceForm
                advanced={study.level === Level.Advanced}
                canEdit={canEdit}
                emissionSource={emissionSource}
                selectedFactor={selectedFactor}
                emissionFactors={emissionFactors}
                update={update}
                caracterisations={caracterisations}
                mandatoryCaracterisation={study.exports.length > 0}
              />
            )}
            {emissionResults && (
              <div className={styles.results} data-testid="emission-source-result">
                <p>{t('results.title')}</p>
                <div className={classNames(styles.row, 'flex')}>
                  <div>
                    <p>{t('results.emission')}</p>
                    <p>{formatNumber(emissionResults.emission / 1000)} tCO₂e</p>
                  </div>
                  {sourceRating && (
                    <div>
                      <p>{tQuality('name')}</p>
                      <p>{tQuality(sourceRating.toString())}</p>
                    </div>
                  )}
                  {emissionResults.confidenceInterval && (
                    <div>
                      <p>{t('results.confiance')}</p>
                      <p>
                        [{formatNumber(emissionResults.confidenceInterval[0])};{' '}
                        {formatNumber(emissionResults.confidenceInterval[1])}]
                      </p>
                    </div>
                  )}
                  {emissionResults.alpha !== null && (
                    <div>
                      <p>{t('results.alpha')}</p>
                      <p>{formatNumber(emissionResults.alpha)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmissionSource
