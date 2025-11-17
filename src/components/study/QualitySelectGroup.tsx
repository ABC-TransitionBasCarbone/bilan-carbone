'use client'

import { FullStudy } from '@/db/study'
import { qualityKeys, specificFEQualityKeys, specificFEQualityKeysLinks } from '@/services/uncertainty'
import ZoomInMapIcon from '@mui/icons-material/ZoomInMap'
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap'
import { FormControl, FormHelperText } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, Controller, FieldValues, Path, useForm, useFormState } from 'react-hook-form'
import Button from '../base/Button'
import HelpIcon from '../base/HelpIcon'
import QualitySelect from '../form/QualitySelect'
import styles from './EmissionSource.module.css'

type AllQualityKeys = (typeof qualityKeys)[number] | (typeof specificFEQualityKeys)[number]
type Source = Partial<Record<AllQualityKeys, number | null>>

interface Props<T extends FieldValues> {
  advanced?: boolean
  canEdit: boolean | null
  emissionSource: Source & { emissionFactor?: FullStudy['emissionSources'][0]['emissionFactor'] }
  update: (key: keyof Source, value: string | number | boolean) => void
  setGlossary: (key: string) => void
  expanded: boolean
  setExpanded: (value: boolean) => void
  canShrink: boolean
  defaultQuality?: number | null
  feSpecific?: boolean
  control?: Control<T>
  clearable?: boolean
  mandatory?: boolean
}

const QualitySelectGroup = <T extends FieldValues>({
  advanced,
  canEdit,
  emissionSource,
  update,
  setGlossary,
  expanded,
  setExpanded,
  canShrink,
  defaultQuality,
  feSpecific,
  control,
  clearable,
  mandatory,
}: Props<T>) => {
  const t = useTranslations('emissionSource')
  const tGlossary = useTranslations('emissionSource.glossary')

  const getField = (field: (typeof qualityKeys)[number]) => (feSpecific ? specificFEQualityKeysLinks[field] : field)

  const getFieldValue = (field: (typeof qualityKeys)[number]) =>
    feSpecific
      ? emissionSource[getField(field)] || (emissionSource.emissionFactor ? emissionSource.emissionFactor[field] : null)
      : emissionSource[field]

  // hack to manage quality errors when fields are required (emission factor) and handle no control provided cases (emission source)
  const mockControl = useForm<T>().control
  const actualControl = (control ?? mockControl) as Control<T>

  const { errors } = useFormState({
    control: actualControl,
    name: qualityKeys.map((key) => getField(key) as Path<T>),
  })

  const qualityFieldErrors = qualityKeys
    .map((field) => errors[getField(field) as keyof typeof errors])
    .filter((error) => error !== undefined)
  const hasQualityError = qualityFieldErrors.length > 0

  return (
    <div
      className={classNames('flex grow', expanded ? `${styles.row} ${styles.quality}` : styles.shrinked, {
        mt1: feSpecific || control,
      })}
    >
      {expanded ? (
        <>
          {qualityKeys.map((key) => (
            <Controller
              key={`qualify-${getField(key)}`}
              name={getField(key) as Path<T>}
              control={actualControl}
              render={({ field, fieldState: { error } }) => (
                <FormControl error={!!error} className={styles.qualitySelect}>
                  <QualitySelect
                    disabled={!canEdit}
                    data-testid={`emission-source-${getField(key)}`}
                    id={field.name}
                    value={getFieldValue(key) || ''}
                    onChange={(event) => {
                      field.onChange(event)
                      update(field.name as keyof Source, Number(event.target.value))
                    }}
                    label={mandatory ? `${t('form.' + key)} *` : t(`form.${key}`)}
                    starredValue={
                      feSpecific && emissionSource.emissionFactor ? emissionSource.emissionFactor[key] : null
                    }
                    error={!!error}
                    clearable={clearable}
                  />
                  {error?.message && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />
          ))}
        </>
      ) : (
        <FormControl error={hasQualityError}>
          <QualitySelect
            data-testid="emission-source-quality-select"
            disabled={!canEdit}
            id="quality"
            value={defaultQuality || ''}
            onChange={(event) => qualityKeys.forEach((field) => update(getField(field), Number(event.target.value)))}
            label={mandatory ? `${t('form.quality')} *` : t('form.quality')}
            error={hasQualityError}
            clearable={clearable}
          />
          {hasQualityError && <FormHelperText>{qualityFieldErrors[0]?.message?.toString()}</FormHelperText>}
        </FormControl>
      )}
      <HelpIcon onClick={() => setGlossary('quality')} label={tGlossary('title')} />
      {!advanced && canShrink && (
        <Button
          className={styles.expandButton}
          data-testid="emission-source-quality-expand-button"
          onClick={() => setExpanded(!expanded)}
          title={t(expanded ? 'form.shrink' : 'form.expand')}
          aria-label={t(expanded ? 'form.shrink' : 'form.expand')}
        >
          {expanded ? <ZoomInMapIcon /> : <ZoomOutMapIcon />}
        </Button>
      )}
    </div>
  )
}

export default QualitySelectGroup
