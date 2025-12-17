'use client'

import LinkButton from '@/components/base/LinkButton'
import LoadingButton from '@/components/base/LoadingButton'
import { FormAutocomplete } from '@/components/form/Autocomplete'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import QualitySelectGroup from '@/components/study/QualitySelectGroup'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { qualityKeys, specificFEQualityKeys } from '@/services/uncertainty'
import { BCUnit, useUnitLabel } from '@/services/unit'
import { ManualEmissionFactorUnitList } from '@/utils/emissionFactors'
import { FormControlLabel, FormLabel, MenuItem, Switch } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Control, UseFormReturn, UseFormSetValue, useWatch } from 'react-hook-form'
import DetailedGES from './DetailedGES'
import MultiplePosts from './MultiplePosts'

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
  locations: string[]
  detailedGES?: boolean
  hasParts: boolean
  setHasParts: (hasParts: boolean) => void
  partsCount: number
  setPartsCount: (count: number) => void
  button: 'create' | 'update'
}

type EmissionFactorQuality = Partial<
  Record<(typeof qualityKeys)[number] | (typeof specificFEQualityKeys)[number], number | null>
>

const EmissionFactorForm = <T extends EmissionFactorCommand>({
  form,
  locations,
  detailedGES,
  hasParts,
  setHasParts,
  partsCount,
  setPartsCount,
  button,
}: Props<T>) => {
  const tAction = useTranslations('common.action')
  const t = useTranslations('emissionFactors.create')
  const tGlossary = useTranslations('emissionSource.glossary')
  const getUnitLabel = useUnitLabel()
  const units = useMemo(
    () => Object.values(ManualEmissionFactorUnitList).sort((a, b) => getUnitLabel(a).localeCompare(getUnitLabel(b))),
    [getUnitLabel],
  )
  const [expandedQuality, setExpandedQuality] = useState(button === 'update')
  const [glossary, setGlossary] = useState('')
  const control = form.control as Control<EmissionFactorCommand>
  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>

  const update = (column: (typeof qualityKeys)[number] | 'isMonetary', value: string | number | boolean) => {
    if (typeof value === 'number' || (column === 'isMonetary' && typeof value === 'boolean')) {
      setValue(column, value)
    }
  }

  const unit = useWatch({ control, name: 'unit' })
  const isMonetary = useWatch({ control, name: 'isMonetary' })

  const [
    reliability,
    technicalRepresentativeness,
    geographicRepresentativeness,
    temporalRepresentativeness,
    completeness,
  ] = useWatch({ control, name: qualityKeys })

  const quality = {
    reliability,
    technicalRepresentativeness,
    geographicRepresentativeness,
    temporalRepresentativeness,
    completeness,
  }

  return (
    <>
      <FormTextField
        data-testid="emission-factor-name"
        control={control}
        name="name"
        label={`${t('name')} *`}
        placeholder={t('namePlaceholder')}
      />
      <FormTextField control={control} name="attribute" label={t('attribute')} />
      <FormAutocomplete
        data-testid="fe-location"
        control={control}
        translation={t}
        options={locations}
        filterOptions={(options, { inputValue }) =>
          options.filter((option) =>
            typeof option === 'string' ? option : option.label.toLowerCase().includes(inputValue.toLowerCase()),
          )
        }
        name="location"
        label={t('location')}
        onInputChange={(_, value) => setValue('location', value?.trim() || '')}
        freeSolo
      />
      <FormTextField data-testid="emission-factor-source" control={control} name="source" label={`${t('source')} *`} />
      <div className="flex gapped">
        <div className="grow">
          <FormSelect
            data-testid="emission-factor-unit"
            control={control}
            translation={t}
            label={`${t('unit')} *`}
            name="unit"
            fullWidth
          >
            <MenuItem value={BCUnit.CUSTOM}>{getUnitLabel(BCUnit.CUSTOM)}</MenuItem>
            {units
              .filter((unit) => unit !== BCUnit.CUSTOM)
              .map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {getUnitLabel(unit)}
                </MenuItem>
              ))}
          </FormSelect>
        </div>
        {unit === BCUnit.CUSTOM && (
          <>
            <div className="grow">
              <FormTextField
                data-testid="emission-factor-custom-unit"
                control={control}
                name="customUnit"
                label={t('customUnit')}
                placeholder={t('customUnitPlaceholder')}
                fullWidth
              />
            </div>
            <div>
              <FormLabel id="monetaryUnit-radio-group-label" component="legend" className="inputLabel align-center">
                <span className="bold">{t('monetaryUnit')}</span>
              </FormLabel>
              <FormControlLabel
                control={
                  <Switch
                    checked={isMonetary}
                    name="isMonetary"
                    onChange={(event) => update('isMonetary', event.target.checked)}
                    data-testid="emission-factor-is-monetary-unit"
                  />
                }
                label={t(isMonetary ? 'yes' : 'no')}
              />
            </div>
          </>
        )}
      </div>

      <DetailedGES
        form={form}
        initialDetailedGES={detailedGES}
        hasParts={hasParts}
        setHasParts={setHasParts}
        partsCount={partsCount}
        setPartsCount={setPartsCount}
      />
      <QualitySelectGroup
        canEdit
        control={control}
        emissionSource={quality}
        update={update as (key: keyof EmissionFactorQuality, value: string | number | boolean) => void}
        advanced={false}
        setGlossary={setGlossary}
        expanded={expandedQuality}
        setExpanded={setExpandedQuality}
        defaultQuality={qualityKeys.map((qualityKey) => quality[qualityKey]).find((quality) => !!quality)}
        canShrink={qualityKeys.every((key) => quality[key] === quality[qualityKeys[0]])}
        mandatory
      />
      <MultiplePosts form={form} context="emissionFactor" />
      <FormTextField control={control} name="comment" label={t('comment')} multiline />
      <div className={classNames({ ['justify-between']: button === 'update' })}>
        {button === 'update' && (
          <LinkButton data-testid="emission-factor-cancel-update" href="/facteurs-d-emission">
            {tAction('cancel')}
          </LinkButton>
        )}
        <div className="justify-end">
          <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="emission-factor-valid-button">
            {t(button)}
          </LoadingButton>
        </div>
      </div>
      {glossary && (
        <GlossaryModal glossary={glossary} onClose={() => setGlossary('')} label="emission-factor" t={tGlossary}>
          <p className="mb-2">
            {tGlossary.rich(`${glossary}Description`, {
              link: (children) => (
                <Link
                  href="https://www.bilancarbone-methode.com/4-comptabilisation/4.4-methode-destimation-des-incertitudes/4.4.2-comment-les-determiner#determination-qualitative"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {children}
                </Link>
              ),
            })}
          </p>
        </GlossaryModal>
      )}
    </>
  )
}

export default EmissionFactorForm
