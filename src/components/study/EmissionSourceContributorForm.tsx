'use client'

import { StudyWithoutDetail } from '@/services/permissions/study'
import { Post, subPostsByPost } from '@/services/posts'
import { EmissionFactorWithMetaData } from '@/services/serverFunctions/emissionFactor'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { qualityKeys } from '@/services/uncertainty'
import { getEmissionFactorValue } from '@/utils/emissionFactors'
import { formatEmissionFactorNumber } from '@/utils/number'
import AddIcon from '@mui/icons-material/Add'
import { TextField } from '@mui/material'
import { StudyResultUnit, SubPost, Unit } from '@prisma/client'
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
  subPost: SubPost
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean | null) => void
}

const getDetail = (metadata: Exclude<EmissionFactorWithMetaData['metaData'], undefined>) =>
  [metadata.attribute, metadata.comment, metadata.location].filter(Boolean).join(' - ')

const EmissionSourceContributorForm = ({ emissionSource, emissionFactors, subPost, selectedFactor, update }: Props) => {
  const t = useTranslations('emissionSource')
  const tResultUnits = useTranslations('study.results.units')
  const tUnits = useTranslations('units')

  return (
    <>
      <div className={classNames(styles.row, 'flex')}>
        <EmissionSourceFactor
          canEdit
          update={update}
          emissionFactors={emissionFactors}
          subPost={subPost}
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
            {selectedFactor && (
              <div className={styles.unit}>
                {selectedFactor.unit === Unit.CUSTOM ? selectedFactor.customUnit : tUnits(selectedFactor.unit || '')}
              </div>
            )}
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
            {formatEmissionFactorNumber(getEmissionFactorValue(selectedFactor))} {tResultUnits(StudyResultUnit.K)}/
            {selectedFactor.unit === Unit.CUSTOM ? selectedFactor.customUnit : tUnits(selectedFactor.unit || '')}
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
        {qualityKeys.map((quality) => (
          <QualitySelect
            key={quality}
            data-testid={`emission-source-${quality}`}
            id={quality}
            value={emissionSource[quality] || ''}
            onChange={(event) => update(quality, Number(event.target.value))}
            label={t(`form.${quality}`)}
            clearable
          />
        ))}
        <QualitySelect
          data-testid="emission-source-reliability"
          id="reliability"
          value={emissionSource.reliability || ''}
          onChange={(event) => update('reliability', Number(event.target.value))}
          label={t('form.reliability')}
          clearable
        />
      </div>
    </>
  )
}

export default EmissionSourceContributorForm
