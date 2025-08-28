'use client'

import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { getEmissionResults } from '@/services/emissionSource'
import { StudyWithoutDetail } from '@/services/permissions/study'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { updateEmissionSource } from '@/services/serverFunctions/emissionSource'
import {
  UpdateEmissionSourceCommand,
  UpdateEmissionSourceCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { EmissionSourcesStatus, getEmissionSourceStatus } from '@/services/study'
import { getStandardDeviationRating } from '@/services/uncertainty'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { hasEditionRights, STUDY_UNIT_VALUES } from '@/utils/study'
import SavedIcon from '@mui/icons-material/CloudUpload'
import { Alert, CircularProgress, FormLabel, TextField } from '@mui/material'
import { EmissionSourceCaracterisation, Import, Level, StudyResultUnit, StudyRole, SubPost, Unit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Path } from 'react-hook-form'
import Label from '../base/Label'
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
  subPost: SubPost
  userRoleOnStudy: StudyRole | null
  caracterisations: EmissionSourceCaracterisation[]
}

const EmissionSource = ({
  study,
  emissionSource,
  emissionFactors,
  subPost,
  userRoleOnStudy,
  withoutDetail,
  caracterisations,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const { environment } = useAppEnvironmentStore()
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const tError = useTranslations('error')
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')
  const tResultstUnits = useTranslations('study.results.units')
  const tQuality = useTranslations('quality')
  const router = useRouter()
  const [display, setDisplay] = useState(false)
  const { callServerFunction } = useServerFunction()

  const detailId = `${emissionSource.id}-detail`

  useEffect(() => {
    const hash = window.location.hash
    if (hash === `#emission-source-${emissionSource.id}`) {
      setDisplay(true)
      setTimeout(() => {
        const element = document.getElementById(`emission-source-${emissionSource.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 600)
    }
  }, [emissionSource.id])

  const canEdit = !emissionSource.validated && hasEditionRights(userRoleOnStudy)
  const canValidate = userRoleOnStudy === StudyRole.Validator

  const update = useCallback(
    async (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean | null | string[]) => {
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
          const parsed = UpdateEmissionSourceCommandValidation.safeParse(command)
          if (parsed.success) {
            await callServerFunction(() => updateEmissionSource(parsed.data), {
              onSuccess: () => {
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
                router.refresh()
              },
            })
          }
        } catch {
          setError('default')
        } finally {
          setLoading(false)
        }
      }
    },
    [emissionSource, router, callServerFunction],
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

  const status = useMemo(
    () => getEmissionSourceStatus(study, emissionSource, environment),
    [study, emissionSource, environment],
  )
  const emissionResults = useMemo(() => getEmissionResults(emissionSource, environment), [emissionSource, environment])

  const isFromOldImport = useMemo(
    () =>
      !!selectedFactor?.version?.id &&
      !study.emissionFactorVersions
        .map((studyImportVersion) => studyImportVersion.importVersionId)
        .includes(selectedFactor.version.id),
    [selectedFactor, study.emissionFactorVersions],
  )

  const currentBEVersion = useMemo(() => {
    const versionId = isFromOldImport
      ? study.emissionFactorVersions.find(
          (emissionFactorVersion) => emissionFactorVersion.source === Import.BaseEmpreinte,
        )?.importVersionId || ''
      : ''
    return versionId ? emissionFactors.find((factor) => factor?.version?.id === versionId)?.version?.name || '' : ''
  }, [study.emissionFactorVersions, isFromOldImport, emissionFactors])

  return (
    <div id={`emission-source-${emissionSource.id}`} className={styles.container}>
      <button
        data-testid={`emission-source-${emissionSource.name}`}
        className={classNames(styles.line, 'flex-col')}
        aria-expanded={display}
        aria-controls={detailId}
        onClick={() => setDisplay((prevDisplay) => !prevDisplay)}
      >
        <div className={classNames(styles.header, 'grow justify-between gapped')}>
          <div className="grow align-center">
            {emissionSource.validated || withoutDetail ? (
              <p data-testid="validated-emission-source-name" className={styles.emissionsSourceName}>
                {emissionSource.name}
              </p>
            ) : (
              <>
                {!emissionSource.name && <FormLabel component="legend">{t('label')}</FormLabel>}
                <TextField
                  disabled={!canEdit}
                  defaultValue={emissionSource.name}
                  data-testid="emission-source-name"
                  onBlur={(event) => update('name', event.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={t('addPlaceholder')}
                  className="grow"
                />
              </>
            )}
          </div>
          <div className="grow align-center gapped">
            {/* activity data */}
            <div className={classNames(styles.emissionSource, 'flex-col justify-center align-center text-center')}>
              {typeof emissionSource.value === 'number' && emissionSource.value !== 0 && (
                <>
                  <p className="text-center">{formatNumber(emissionSource.value)} </p>
                  <p className="text-center">
                    {selectedFactor &&
                      (selectedFactor.unit === Unit.CUSTOM
                        ? selectedFactor.customUnit
                        : tUnits(selectedFactor.unit || ''))}
                  </p>
                </>
              )}
            </div>
            {/* emission factor */}
            {selectedFactor && (
              <div className={classNames(styles.emissionFactor, 'flex-col justify-center align-center text-center')}>
                <>
                  <p className="text-center">
                    {formatEmissionFactorNumber(getEmissionFactorValue(selectedFactor, environment))}
                  </p>
                  <p className="text-center">
                    {tResultstUnits(StudyResultUnit.K)}/
                    {selectedFactor.unit === Unit.CUSTOM
                      ? selectedFactor.customUnit
                      : tUnits(selectedFactor.unit || '')}
                  </p>
                </>
              </div>
            )}
            {/* result */}
            <div className={classNames(styles.result, 'flex-col flex-end align-end text-center grow')}>
              <p className={styles.resultText} data-testid="emission-source-value">
                {`${formatNumber(emissionResults.emissionValue / STUDY_UNIT_VALUES[study.resultsUnit])} ${tResultstUnits(study.resultsUnit)}`}
              </p>
              {emissionResults.standardDeviation && (
                <p
                  className={classNames(styles.resultQuality, styles.resultText)}
                  data-testid="emission-source-quality"
                >
                  {tQuality('name')}{' '}
                  {tQuality(getStandardDeviationRating(emissionResults.standardDeviation).toString())}
                </p>
              )}
            </div>
          </div>
          <div className={classNames(styles.status, 'flex-cc')} data-testid="emission-source-status">
            {loading || saved ? (
              <>
                {loading && (
                  <>
                    {t('saving')} <CircularProgress size="1rem" />
                  </>
                )}
                {saved && (
                  <span className={classNames(styles.saved, 'align-center')}>
                    <SavedIcon />
                    {t('saved')}
                  </span>
                )}
              </>
            ) : (
              <Label
                className={classNames(
                  styles.statusLabel,
                  status === EmissionSourcesStatus.Valid ? styles.validated : styles.working,
                  'text-center',
                )}
              >
                {t(`status.${status}`)}
              </Label>
            )}
          </div>
        </div>
        {emissionSource.contributor && (
          <p data-testid="emission-source-contributor" className={styles.status}>
            {emissionSource.contributor.user.email}
          </p>
        )}
      </button>
      <div id={detailId} className={classNames(styles.detail, { [styles.displayed]: display }, 'px1')} ref={ref}>
        {display && (
          <div className={styles.detailContent}>
            {error && (
              <Alert className="mb1" severity="error">
                {tError(error)}
              </Alert>
            )}
            {withoutDetail ? (
              <EmissionSourceContributorForm
                emissionSource={emissionSource}
                selectedFactor={selectedFactor}
                subPost={subPost}
                emissionFactors={emissionFactors}
                update={update}
                isFromOldImport={isFromOldImport}
                currentBEVersion={currentBEVersion}
                advanced={study.level === Level.Advanced}
                environment={environment}
              />
            ) : (
              <EmissionSourceForm
                studyId={study.id}
                advanced={study.level === Level.Advanced}
                canEdit={canEdit}
                userRoleOnStudy={userRoleOnStudy}
                canValidate={canValidate}
                emissionSource={emissionSource}
                selectedFactor={selectedFactor}
                emissionFactors={emissionFactors}
                subPost={subPost}
                update={update}
                environment={environment}
                caracterisations={caracterisations}
                mandatoryCaracterisation={study.exports.length > 0}
                status={status}
                studySites={study.sites}
                isFromOldImport={isFromOldImport}
                currentBEVersion={currentBEVersion}
                studyUnit={study.resultsUnit}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmissionSource
