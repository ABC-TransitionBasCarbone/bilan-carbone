'use client'

import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import AddIcon from '@mui/icons-material/Add'
import { TextField } from '@mui/material'
import { StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Path } from 'react-hook-form'
import LinkButton from '../base/LinkButton'
import QualitySelect from '../form/QualitySelect'
import styles from './EmissionSource.module.css'
import EmissionSourceFactor from './EmissionSourceFactor'

interface Props {
  emissionSource: StudyWithoutDetail['emissionSources'][0]
  emissionFactors: EmissionFactorWithMetaData[]
  selectedFactor?: EmissionFactorWithMetaData
  resultsUnit: StudyResultUnit
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean) => void
}

const getDetail = (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) =>
  [metadata.attribute, metadata.comment, metadata.location].filter(Boolean).join(' - ')

const EmissionSourceContributorForm = ({
  emissionSource,
  emissionFactors,
  selectedFactor,
  resultsUnit,
  update,
}: Props) => {
  const t = useTranslations('emissionSource')
  const tResultUnits = useTranslations('study.results.unit')
  const tUnits = useTranslations('units')

  return (
    <>
      <div className={classNames(styles.row, 'flex')}>
        <EmissionSourceFactor
          canEdit
          update={update}
          emissionFactors={emissionFactors}
          selectedFactor={selectedFactor}
          getDetail={getDetail}
        />
        <div className={classNames(styles.gapped, 'flex')}>
          <div className={classNames(styles.inputWithUnit, 'flex grow')}>
            <TextField
              className="grow"
              type="number"
              data-testid="emission-source-value-da"
              defaultValue={emissionSource.value}
              onBlur={(event) => update('value', Number(event.target.value))}
              label={`${t('form.value')} *`}
              slotProps={{ input: { onWheel: (event) => (event.target as HTMLInputElement).blur() } }}
            />
            {selectedFactor && <div className={styles.unit}>{tUnits(selectedFactor.unit)}</div>}
          </div>
          {subPostsByPost[Post.Immobilisations].includes(emissionSource.subPost) && (
            <div className={classNames(styles.inputWithUnit, 'flex grow')}>
              <TextField
                className="grow"
                type="number"
                defaultValue={emissionSource.depreciationPeriod}
                onBlur={(event) => update('depreciationPeriod', Number(event.target.value))}
                label={`${t('form.depreciationPeriod')} *`}
                slotProps={{
                  inputLabel: { shrink: true },
                  input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
                }}
              />
              <div className={styles.unit}>{t('form.years')}</div>
            </div>
          )}
        </div>
        <TextField
          data-testid="emission-source-source"
          defaultValue={emissionSource.source}
          onBlur={(event) => update('source', event.target.value)}
          label={t('form.source')}
        />
      </div>
      {selectedFactor ? (
        <div className={styles.row} data-testid="emission-source-factor">
          <p className={styles.header}>
            {selectedFactor.metaData?.title}
            {selectedFactor.location ? ` - ${selectedFactor.location}` : ''}
            {selectedFactor.metaData?.location ? ` - ${selectedFactor.metaData.location}` : ''} -{' '}
            {formatNumber(getEmissionFactorValue(selectedFactor) / STUDY_UNIT_VALUES[resultsUnit], 5)}{' '}
            {tResultUnits(resultsUnit)}/{tUnits(selectedFactor.unit)}{' '}
          </p>
          {selectedFactor.metaData && <p className={styles.detail}>{getDetail(selectedFactor.metaData)}</p>}
        </div>
      ) : (
        <LinkButton color="secondary" href="/facteurs-d-emission/creer" className="mt-2">
          <AddIcon />
          {t('createEmissionFactor')}
        </LinkButton>
      )}

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
