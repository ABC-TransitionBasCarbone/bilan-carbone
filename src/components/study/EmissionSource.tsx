'use client'

import { FullStudy } from '@/db/study'
import EditIcon from '@mui/icons-material/Edit'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './EmissionSource.module.css'
import { EmissionSourcesStatus, getEmissionSourceStatus } from '@/services/study'
import { useTranslations } from 'next-intl'
import classNames from 'classnames'
import { FormControlLabel, Switch } from '@mui/material'
import {
  UpdateEmissionSourceCommand,
  UpdateEmissionSourceCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { updateEmissionSource } from '@/services/serverFunctions/emissionSource'
import { Path } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { getQualityRating } from '@/services/uncertainty'
import { StudyRole } from '@prisma/client'
import { getEmissionResults } from '@/services/emissionSource'
import { StudyWithoutDetail } from '@/services/permissions/study'
import EmissionSourceForm from './EmissionSourceForm'
import EmissionSourceContributorForm from './EmissionSourceContributorForm'

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
}

const EmissionSource = ({
  study,
  emissionSource,
  emissionFactors,
  userRoleOnStudy,
  withoutDetail,
}: Props & (StudyProps | StudyWithoutDetailProps)) => {
  const ref = useRef<HTMLDivElement>(null)
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')
  const tQuality = useTranslations('quality')

  const router = useRouter()
  const [display, setDisplay] = useState(false)

  const detailId = `${emissionSource.id}-detail`
  const canEdit = userRoleOnStudy && userRoleOnStudy !== StudyRole.Reader
  const canValidate = userRoleOnStudy && userRoleOnStudy === StudyRole.Validator

  const update = useCallback(
    async (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean) => {
      if (key) {
        const command = {
          emissionSourceId: emissionSource.id,
          [key]: value,
        }
        const isValid = UpdateEmissionSourceCommandValidation.safeParse(command)
        if (isValid.success) {
          const result = await updateEmissionSource(isValid.data)
          if (!result) {
            router.refresh()
          }
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
          <p data-testid="emission-source-status" className={styles.status}>
            {t(`status.${status}`)}
          </p>
        </div>
        <div className={classNames(styles.infosRight, 'flex-col')}>
          <p data-testid="emission-source-value">
            {emissionResults === null ? (
              emissionSource.value !== null ? (
                <>
                  {emissionSource.value} {selectedFactor && tUnits(selectedFactor.unit)}
                </>
              ) : null
            ) : (
              `${emissionResults.emission.toFixed(2)} kgCO₂e`
            )}
          </p>
          {sourceRating && (
            <p className={styles.status} data-testid="emission-source-quality">
              {tQuality('name')} {tQuality(sourceRating.toString())}
            </p>
          )}
        </div>
        <div className={styles.editIcon}>
          <EditIcon />
        </div>
      </button>
      <div id={detailId} className={classNames(styles.detail, { [styles.displayed]: display })} ref={ref}>
        {display && (
          <div className={styles.detailContent}>
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
                canEdit={canEdit}
                emissionSource={emissionSource}
                selectedFactor={selectedFactor}
                emissionFactors={emissionFactors}
                update={update}
              />
            )}
            {emissionResults && (
              <div className={styles.results} data-testid="emission-source-result">
                <p>{t('results.title')}</p>
                <div className={classNames(styles.row, 'flex')}>
                  <div>
                    <p>{t('results.emission')}</p>
                    <p>{emissionResults.emission.toFixed(2)} kgCO₂e</p>
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
                        [{emissionResults.confidenceInterval[0].toFixed(2)};{' '}
                        {emissionResults.confidenceInterval[1].toFixed(2)}]
                      </p>
                    </div>
                  )}
                  {emissionResults.alpha !== null && (
                    <div>
                      <p>{t('results.alpha')}</p>
                      <p>{emissionResults.alpha.toFixed(2)}</p>
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
