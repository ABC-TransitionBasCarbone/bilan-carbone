'use client'

import { FullStudy } from '@/db/study'
import EditIcon from '@mui/icons-material/Edit'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './EmissionSource.module.css'
import { EmissionSourcesStatus, getEmissionSourceStatus } from '@/services/study'
import { useTranslations } from 'next-intl'
import classNames from 'classnames'
import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Switch, TextField } from '@mui/material'
import {
  UpdateEmissionSourceCommand,
  UpdateEmissionSourceCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { updateEmissionSource } from '@/services/serverFunctions/emissionSource'
import { Path } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import EmissionSourceFactor from './EmissionSourceFactor'
import { EmissionWithMetaData } from '@/services/emissions'
import QualitySelect from '../form/QualitySelect'
import { getQualityRating } from '@/services/uncertainty'
import { EmissionSourceType } from '@prisma/client'
import { getEmissionResults } from '@/services/emissionSource'

interface Props {
  emissions: EmissionWithMetaData[]
  emissionSource: FullStudy['emissionSources'][0]
}

const EmissionSource = ({ emissionSource, emissions }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')
  const tQuality = useTranslations('quality')

  const router = useRouter()
  const [display, setDisplay] = useState(false)

  const detailId = `${emissionSource.id}-detail`

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
      return emissions.find((emission) => emission.id === emissionSource.emissionFactor?.id)
    }
  }, [emissionSource.emissionFactor, emissions])

  const status = useMemo(() => getEmissionSourceStatus(emissionSource), [emissionSource])
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
            {emissionResults === null
              ? (emissionSource.value ?? (
                  <>
                    {emissionSource.value} {selectedFactor && tUnits(selectedFactor.unit)}
                  </>
                ))
              : `${emissionResults.emission.toFixed(2)} kgCO₂e`}
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
                {status !== EmissionSourcesStatus.Waiting && (
                  <FormControlLabel
                    control={
                      <Switch
                        data-testid="emission-source-validated"
                        defaultChecked={emissionSource.validated || false}
                        onChange={(event) => update('validated', event.target.checked)}
                      />
                    }
                    label={t('form.validate')}
                    labelPlacement="start"
                  />
                )}
              </div>
            </div>
            <div className={classNames(styles.row, 'flex')}>
              <TextField
                defaultValue={emissionSource.name}
                data-testid="emission-source-name"
                onBlur={(event) => update('name', event.target.value)}
                label={t('form.name')}
              />
              <TextField
                defaultValue={emissionSource.tag}
                data-testid="emission-source-tag"
                onBlur={(event) => update('tag', event.target.value)}
                label={t('form.tag')}
              />
              <TextField
                defaultValue={emissionSource.caracterisation}
                data-testid="emission-source-caracterisation"
                onBlur={(event) => update('caracterisation', event.target.value)}
                label={t('form.caracterisation')}
              />
            </div>
            <div className={styles.row}>
              <EmissionSourceFactor update={update} emissions={emissions} selectedFactor={selectedFactor} />
            </div>
            <div className={classNames(styles.row, 'flex')}>
              <div className={styles.inputWithUnit}>
                <TextField
                  type="number"
                  data-testid="emission-source-value-da"
                  defaultValue={emissionSource.value}
                  onBlur={(event) => update('value', Number(event.target.value))}
                  label={t('form.value')}
                />
                {selectedFactor && <div className={styles.unit}>{tUnits(selectedFactor.unit)}</div>}
              </div>
              <TextField
                data-testid="emission-source-source"
                defaultValue={emissionSource.source}
                onBlur={(event) => update('source', event.target.value)}
                label={t('form.source')}
              />
              <FormControl>
                <InputLabel id={'type-label'}>{t('form.type')}</InputLabel>
                <Select
                  data-testid="emission-source-type"
                  value={emissionSource.type || ''}
                  onChange={(event) => update('type', event.target.value)}
                  label={t('form.type')}
                  labelId={'type-label'}
                >
                  {Object.keys(EmissionSourceType).map((value) => (
                    <MenuItem key={value} value={value}>
                      {t(`type.${value}`)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
            <div className={classNames(styles.row, 'flex')}>
              <QualitySelect
                data-testid="emission-source-reliability"
                id="reliability"
                value={emissionSource.reliability || ''}
                onChange={(event) => update('reliability', Number(event.target.value))}
                label={t('form.reliability')}
              />
              <QualitySelect
                data-testid="emission-source-technicalRepresentativeness"
                id="technicalRepresentativeness"
                value={emissionSource.technicalRepresentativeness || ''}
                onChange={(event) => update('technicalRepresentativeness', Number(event.target.value))}
                label={t('form.technicalRepresentativeness')}
              />
              <QualitySelect
                data-testid="emission-source-geographicRepresentativeness"
                id="geographicRepresentativeness"
                value={emissionSource.geographicRepresentativeness || ''}
                onChange={(event) => update('geographicRepresentativeness', Number(event.target.value))}
                label={t('form.geographicRepresentativeness')}
              />
              <QualitySelect
                data-testid="emission-source-temporalRepresentativeness"
                id="temporalRepresentativeness"
                value={emissionSource.temporalRepresentativeness || ''}
                onChange={(event) => update('temporalRepresentativeness', Number(event.target.value))}
                label={t('form.temporalRepresentativeness')}
              />
              <QualitySelect
                data-testid="emission-source-completeness"
                id="completeness"
                value={emissionSource.completeness || ''}
                onChange={(event) => update('completeness', Number(event.target.value))}
                label={t('form.completeness')}
              />
            </div>
            <div className={classNames(styles.row, 'flex')}>
              <TextField
                data-testid="emission-source-comment"
                defaultValue={emissionSource.comment}
                onBlur={(event) => update('comment', event.target.value)}
                label={t('form.comment')}
              />
            </div>
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
