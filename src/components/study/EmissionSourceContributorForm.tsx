'use client'

import React from 'react'
import styles from './EmissionSource.module.css'
import { TextField } from '@mui/material'
import EmissionSourceFactor from './EmissionSourceFactor'
import classNames from 'classnames'
import QualitySelect from '../form/QualitySelect'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { Path } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { StudyWithoutDetail } from '@/services/permissions/study'

interface Props {
  emissionSource: StudyWithoutDetail['emissionSources'][0]
  emissionFactors: EmissionFactorWithMetaData[]
  selectedFactor?: EmissionFactorWithMetaData
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean) => void
}

const EmissionSourceContributorForm = ({ emissionSource, update, emissionFactors, selectedFactor }: Props) => {
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')

  return (
    <>
      <div className={styles.row}>
        <EmissionSourceFactor
          canEdit
          update={update}
          emissionFactors={emissionFactors}
          selectedFactor={selectedFactor}
        />
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
    </>
  )
}

export default EmissionSourceContributorForm
