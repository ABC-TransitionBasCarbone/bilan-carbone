'use client'

import { keepOnlyOneMetadata } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import { Locale } from '@/i18n/config'
import { getLocale } from '@/i18n/locale'
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
import { useUnitLabel } from '@/services/unit'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { hasEditionRights, STUDY_UNIT_VALUES } from '@/utils/study'
import SavedIcon from '@mui/icons-material/CloudUpload'
import { Alert, CircularProgress, FormLabel, TextField } from '@mui/material'
import {
  EmissionSourceCaracterisation,
  Export,
  Import,
  Level,
  StudyResultUnit,
  StudyRole,
  SubPost,
  Unit,
} from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Path } from 'react-hook-form'
import Label from '../base/Label'
import { ImportVersionForFilters } from '../emissionFactor/EmissionFactorsFilters'
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
  subPost: SubPost
  userRoleOnStudy: StudyRole | null
  caracterisations: EmissionSourceCaracterisation[]
  emissionFactorsForSubPost: EmissionFactorWithMetaData[]
  importVersions: ImportVersionForFilters[]
  isContributor?: boolean
}

const EmissionSource = ({
  study,
  emissionSource,
  subPost,
  userRoleOnStudy,
  withoutDetail,
  caracterisations,
  emissionFactorsForSubPost,
  importVersions,
  isContributor = false,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const { environment } = useAppEnvironmentStore()
  const ref = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const tError = useTranslations('error')
  const t = useTranslations('emissionSource')
  const tResultstUnits = useTranslations('study.results.units')
  const tQuality = useTranslations('quality')
  const getUnitLabel = useUnitLabel()
  const router = useRouter()
  const [display, setDisplay] = useState(false)
  const { callServerFunction } = useServerFunction()
  const [locale, setLocale] = useState(Locale.FR)

  const detailId = `${emissionSource.id}-detail`

  useEffect(() => {
    async function fetchLocale() {
      const localeCookie = await getLocale()
      setLocale(localeCookie)
    }

    fetchLocale()
  }, [])

  useEffect(() => {
    const hash = window.location.hash
    if (hash === `#emission-source-${emissionSource.id}`) {
      setDisplay(true)
      setTimeout(() => {
        const element = document.getElementById(`emission-source-${emissionSource.id}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        router.replace(window.location.pathname + window.location.search, { scroll: false })
      }, 300)
    }
  }, [emissionSource.id, router])

  const canEdit = !emissionSource.validated && (hasEditionRights(userRoleOnStudy) || isContributor)
  const canValidate = userRoleOnStudy === StudyRole.Validator
  const canDelete = !emissionSource.validated && hasEditionRights(userRoleOnStudy)

  const update = useCallback(
    async (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean | Date | null | string[]) => {
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
    if (!emissionSource.emissionFactor) {
      return undefined
    }
    return keepOnlyOneMetadata([emissionSource.emissionFactor], locale)[0]
  }, [emissionSource.emissionFactor, locale])

  const status = useMemo(
    () => getEmissionSourceStatus(study, emissionSource, environment),
    [study, emissionSource, environment],
  )
  const emissionResults = useMemo(() => {
    if (!environment) {
      return { emissionValue: 0, standardDeviation: 0 }
    }

    return getEmissionResults(emissionSource, environment)
  }, [emissionSource, environment])

  const isFromOldImport = useMemo(
    () =>
      !!selectedFactor?.version?.id &&
      !study.emissionFactorVersions
        .map((studyImportVersion) => studyImportVersion.importVersionId)
        .includes(selectedFactor.version.id),
    [selectedFactor, study.emissionFactorVersions],
  )

  const currentBEVersion = useMemo(() => {
    const version = isFromOldImport
      ? study.emissionFactorVersions.find(
          (emissionFactorVersion) => emissionFactorVersion.source === Import.BaseEmpreinte,
        )?.importVersion.name
      : ''
    return version ?? ''
  }, [study.emissionFactorVersions, isFromOldImport])

  if (!environment) {
    return null
  }

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
                        : getUnitLabel(selectedFactor.unit, emissionSource.value))}
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
                      : getUnitLabel(selectedFactor.unit)}
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
                studyId={study.id}
                emissionSource={emissionSource}
                selectedFactor={selectedFactor}
                subPost={subPost}
                update={update}
                isFromOldImport={isFromOldImport}
                currentBEVersion={currentBEVersion}
                advanced={study.level === Level.Advanced}
                environment={environment}
                emissionFactorsForSubPost={emissionFactorsForSubPost}
                importVersions={importVersions}
                displayConstructionYear={!!study.exports?.types.some((studyExport) => studyExport === Export.GHGP)}
              />
            ) : (
              <EmissionSourceForm
                studyId={study.id}
                advanced={study.level === Level.Advanced}
                canEdit={canEdit}
                canDelete={canDelete}
                userRoleOnStudy={userRoleOnStudy}
                canValidate={canValidate}
                emissionSource={emissionSource}
                selectedFactor={selectedFactor}
                subPost={subPost}
                update={update}
                environment={environment}
                caracterisations={caracterisations}
                displayCaracterisation={!!study.exports?.types.length}
                displayConstructionYear={!!study.exports?.types.some((studyExport) => studyExport === Export.GHGP)}
                status={status}
                studySites={study.sites}
                isFromOldImport={isFromOldImport}
                currentBEVersion={currentBEVersion}
                studyUnit={study.resultsUnit}
                userOrganizationId={study.organizationVersion.organization.id}
                emissionFactorsForSubPost={emissionFactorsForSubPost}
                importVersions={importVersions}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmissionSource
