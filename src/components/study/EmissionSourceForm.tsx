'use client'
import { FullStudy } from '@/db/study'
import { EmissionFactorWithMetaData } from '@/services/emissionFactors'
import { Post, subPostsByPost } from '@/services/posts'
import { UpdateEmissionSourceCommand } from '@/services/serverFunctions/emissionSource.command'
import { FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material'
import { EmissionSourceCaracterisation, EmissionSourceType } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Path } from 'react-hook-form'
import DeleteEmissionSource from './DeleteEmissionSource'
import styles from './EmissionSource.module.css'
import EmissionSourceFactor from './EmissionSourceFactor'
import QualitySelectGroup from './QualitySelectGroup'

interface Props {
  advanced?: boolean
  emissionSource: FullStudy['emissionSources'][0]
  canEdit: boolean | null
  emissionFactors: EmissionFactorWithMetaData[]
  selectedFactor?: EmissionFactorWithMetaData
  update: (key: Path<UpdateEmissionSourceCommand>, value: string | number | boolean) => void
  caracterisations: EmissionSourceCaracterisation[]
  mandatoryCaracterisation: boolean
}

const EmissionSourceForm = ({
  advanced,
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
  const [error, setError] = useState('')

  const handleUpdate = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (Number(event.target.value) > 0) {
      setError('')
      update('value', Number(event.target.value))
    } else {
      setError(`${t('form.sign')}`)
      event.target.value = ''
    }
  }

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
            onBlur={(event) => handleUpdate(event)}
            label={`${t('form.value')} *`}
            helperText={error}
            error={!!error}
            slotProps={{
              htmlInput: { min: 0 },
              input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
              inputLabel: { shrink: !!selectedFactor || emissionSource.value !== null },
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
      {subPostsByPost[Post.Immobilisations].includes(emissionSource.subPost) && (
        <div className={classNames(styles.row, styles.inputWithUnit, 'flex')}>
          <TextField
            disabled={!canEdit}
            type="number"
            defaultValue={emissionSource.depreciationPeriod}
            className={styles.depreciationPeriod}
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
      <QualitySelectGroup canEdit={canEdit} emissionSource={emissionSource} update={update} advanced={advanced} />
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
