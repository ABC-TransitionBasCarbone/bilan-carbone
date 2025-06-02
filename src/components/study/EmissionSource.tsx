'use client'

import { FullStudy } from '@/db/study'
import { getEmissionResults } from '@/services/emissionSource'
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
import { formatEmissionFactorNumber, formatNumber } from '@/utils/number'
import { hasEditionRights, STUDY_UNIT_VALUES } from '@/utils/study'
import SavedIcon from '@mui/icons-material/CloudUpload'
import EditIcon from '@mui/icons-material/Edit'
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

  const detailId = `${emissionSource.id}-detail`
  const canEdit = !emissionSource.validated && hasEditionRights(userRoleOnStudy)
  const canValidate = userRoleOnStudy === StudyRole.Validator

  const update = useCallback(
    async (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean | null) => {
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
            const result = await updateEmissionSource(parsed.data)
            if (!result.success) {
              setError(result.errorMessage)
            } else {
              setSaved(true)
              setTimeout(() => setSaved(false), 3000)
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
    <div className={styles.container}>
      <button
        data-testid={`emission-source-${emissionSource.name}`}
        className={classNames(styles.line, 'flex-col')}
        aria-expanded={display}
        aria-controls={detailId}
        onClick={() => setDisplay(!display)}
      >
        <div className={classNames(styles.header, styles.gapped, 'grow justify-between')}>
          <div className={classNames(styles.name, 'align-center grow')}>
            {emissionSource.validated || withoutDetail ? (
              <p data-testid="validated-emission-source-name">{emissionSource.name}</p>
            ) : (
              <>
                {!emissionSource.name && <FormLabel component="legend">{t('label')}</FormLabel>}
                <TextField
                  className="grow"
                  disabled={!canEdit}
                  defaultValue={emissionSource.name}
                  data-testid="emission-source-name"
                  onBlur={(event) => update('name', event.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={t('addPlaceholder')}
                />
              </>
            )}
          </div>
          <div className={classNames(styles.gapped, 'align-center')}>
            {/* activity data */}
            <div className="flex-col justify-center text-center">
              {typeof emissionSource.value === 'number' && emissionSource.value !== 0 && (
                <>
                  <p>{t('emissionSource')}</p>
                  <p>
                    {formatNumber(emissionSource.value)}{' '}
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
              <div className="flex-col justify-center text-center">
                <p>{t('emissionFactor')}</p>
                <p>
                  {formatEmissionFactorNumber(getEmissionFactorValue(selectedFactor))}
                  {tResultstUnits(StudyResultUnit.K)}/
                  {selectedFactor.unit === Unit.CUSTOM ? selectedFactor.customUnit : tUnits(selectedFactor.unit || '')}
                </p>
              </div>
            )}
            {/* result */}
            {emissionResults && (
              <div className="flex-col justify-center text-center">
                <p
                  className={styles.result}
                  data-testid="emission-source-value"
                >{`${formatNumber(emissionResults.emission / STUDY_UNIT_VALUES[study.resultsUnit])} ${tResultstUnits(study.resultsUnit)}`}</p>
                {emissionResults.standardDeviation && (
                  <p className={styles.status} data-testid="emission-source-quality">
                    {tQuality('name')}{' '}
                    {tQuality(getStandardDeviationRating(emissionResults.standardDeviation).toString())}
                  </p>
                )}
              </div>
            )}
          </div>
          <div data-testid="emission-source-status" className={classNames(styles.status, 'flex-cc')}>
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
            <Label
              className={classNames(
                styles.statusLabel,
                status === EmissionSourcesStatus.Valid ? styles.validated : styles.working,
                'text-center ml1',
              )}
            >
              {t(`status.${status}`)}
            </Label>
          </div>
        </div>
        {emissionSource.contributor && (
          <p data-testid="emission-source-contributor" className={styles.status}>
            {emissionSource.contributor.user.email}
          </p>
        )}
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
            {withoutDetail ? (
              <EmissionSourceContributorForm
                emissionSource={emissionSource}
                selectedFactor={selectedFactor}
                subPost={subPost}
                emissionFactors={emissionFactors}
                update={update}
                isFromOldImport={isFromOldImport}
                currentBEVersion={currentBEVersion}
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
                caracterisations={caracterisations}
                mandatoryCaracterisation={study.exports.length > 0}
                status={status}
                studySites={study.sites}
                isFromOldImport={isFromOldImport}
                currentBEVersion={currentBEVersion}
              />
            )}
            {emissionResults && (
              <div className={styles.results} data-testid="emission-source-result">
                <p>{t('results.title')}</p>
                <div className={classNames(styles.row, 'flex')}>
                  <div>
                    <p>{t('results.emission')}</p>
                    <p>
                      {formatNumber(emissionResults.emission / STUDY_UNIT_VALUES[study.resultsUnit])}{' '}
                      {tResultstUnits(study.resultsUnit)}
                    </p>
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
                        [{formatNumber(emissionResults.confidenceInterval[0], 2)};{' '}
                        {formatNumber(emissionResults.confidenceInterval[1], 2)}]
                      </p>
                    </div>
                  )}
                  {emissionResults.alpha !== null && (
                    <div>
                      <p>{t('results.alpha')}</p>
                      <p>{formatNumber(emissionResults.alpha, 2)}</p>
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
