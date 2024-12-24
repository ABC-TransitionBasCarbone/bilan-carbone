'use client'
import { FullStudy } from '@/db/study'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { EmissionSourceCaracterisation, EmissionSourceType } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Path } from 'react-hook-form'
import QualitySelect from '../form/QualitySelect'
import DeleteEmissionSource from './DeleteEmissionSource'
import styles from './EmissionSource.module.css'
import EmissionSourceFactor from './EmissionSourceFactor'

interface Props {
  emissionSource: FullStudy['emissionSources'][0]
  canEdit: boolean | null
  emissionFactors: EmissionFactorWithMetaData[]
  selectedFactor?: EmissionFactorWithMetaData
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean) => void
  caracterisations: EmissionSourceCaracterisation[]
  mandatoryCaracterisation: boolean
}

const EmissionSourceForm = ({
  emissionSource,
  canEdit,
  update,
  emissionFactors,
  selectedFactor,
  caracterisations,
  mandatoryCaracterisation,
}: Props) => {
  const t = useTranslations('emissionSource')
  const tUnits = useTranslations('units')
  const tCategorisations = useTranslations('categorisations')

  return (
    <>
      <div className={classNames(styles.row, 'flex')}>
        <TextField
          disabled={!canEdit}
          defaultValue={emissionSource.name}
          data-testid="emission-source-name"
          onBlur={(event) => update('name', event.target.value)}
          label={`${t('form.name')} *`}
        />
        <TextField
          disabled={!canEdit}
          defaultValue={emissionSource.tag}
          data-testid="emission-source-tag"
          onBlur={(event) => update('tag', event.target.value)}
          label={t('form.tag')}
        />
        {caracterisations.length > 0 && (
          <FormControl>
            <InputLabel id="emission-source-caracterisation-label">{`${t('form.caracterisation')}${mandatoryCaracterisation ? ' *' : ''}`}</InputLabel>
            <Select
              disabled={!canEdit || caracterisations.length === 1}
              value={emissionSource.caracterisation || ''}
              data-testid="emission-source-caracterisation"
              onChange={(event) => update('caracterisation', event.target.value)}
              labelId="emission-source-caracterisation-label"
              label={`${t('form.caracterisation')}${mandatoryCaracterisation ? ' *' : ''}`}
            >
              {caracterisations.map((categorisation) => (
                <MenuItem key={categorisation} value={categorisation}>
                  {tCategorisations(categorisation)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </div>
      <div className={styles.row}>
        <EmissionSourceFactor
          canEdit={canEdit}
          update={update}
          emissionFactors={emissionFactors}
          selectedFactor={selectedFactor}
        />
      </div>
      <div className={classNames(styles.row, 'flex')}>
        <div className={styles.inputWithUnit}>
          <TextField
            disabled={!canEdit}
            type="number"
            data-testid="emission-source-value-da"
            defaultValue={emissionSource.value}
            onBlur={(event) => update('value', Number(event.target.value))}
            label={`${t('form.value')} *`}
            slotProps={{
              inputLabel: { shrink: !!selectedFactor || emissionSource.value !== null },
              input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
            }}
          />
          {selectedFactor && <div className={styles.unit}>{tUnits(selectedFactor.unit)}</div>}
        </div>
        <TextField
          disabled={!canEdit}
          data-testid="emission-source-source"
          defaultValue={emissionSource.source}
          onBlur={(event) => update('source', event.target.value)}
          label={t('form.source')}
        />
        <FormControl>
          <InputLabel id={'type-label'}>{`${t('form.type')} *`}</InputLabel>
          <Select
            disabled={!canEdit}
            data-testid="emission-source-type"
            value={emissionSource.type || ''}
            onChange={(event) => update('type', event.target.value)}
            label={`${t('form.type')} *`}
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
          disabled={!canEdit}
          data-testid="emission-source-reliability"
          id="reliability"
          value={emissionSource.reliability || ''}
          onChange={(event) => update('reliability', Number(event.target.value))}
          label={t('form.reliability')}
        />
        <QualitySelect
          disabled={!canEdit}
          data-testid="emission-source-technicalRepresentativeness"
          id="technicalRepresentativeness"
          value={emissionSource.technicalRepresentativeness || ''}
          onChange={(event) => update('technicalRepresentativeness', Number(event.target.value))}
          label={t('form.technicalRepresentativeness')}
        />
        <QualitySelect
          disabled={!canEdit}
          data-testid="emission-source-geographicRepresentativeness"
          id="geographicRepresentativeness"
          value={emissionSource.geographicRepresentativeness || ''}
          onChange={(event) => update('geographicRepresentativeness', Number(event.target.value))}
          label={t('form.geographicRepresentativeness')}
        />
        <QualitySelect
          disabled={!canEdit}
          data-testid="emission-source-temporalRepresentativeness"
          id="temporalRepresentativeness"
          value={emissionSource.temporalRepresentativeness || ''}
          onChange={(event) => update('temporalRepresentativeness', Number(event.target.value))}
          label={t('form.temporalRepresentativeness')}
        />
        <QualitySelect
          disabled={!canEdit}
          data-testid="emission-source-completeness"
          id="completeness"
          value={emissionSource.completeness || ''}
          onChange={(event) => update('completeness', Number(event.target.value))}
          label={t('form.completeness')}
        />
      </div>
      <div className={classNames(styles.row, 'flex')}>
        <TextField
          disabled={!canEdit}
          data-testid="emission-source-comment"
          defaultValue={emissionSource.comment}
          onBlur={(event) => update('comment', event.target.value)}
          label={t('form.comment')}
        />
      </div>
      {canEdit && (
        <div className={classNames(styles.delete, 'mt1', 'w100', 'flex')}>
          <DeleteEmissionSource emissionSource={emissionSource} />
        </div>
      )}
    </>
  )
}

export default EmissionSourceForm
