'use client'

import LinkButton from '@/components/base/LinkButton'
import LoadingButton from '@/components/base/LoadingButton'
import { FormSelect } from '@/components/form/Select'
import { FormTextField } from '@/components/form/TextField'
import GlossaryModal from '@/components/modals/GlossaryModal'
import QualitySelectGroup from '@/components/study/QualitySelectGroup'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { qualityKeys, specificFEQualityKeys } from '@/services/uncertainty'
import { MenuItem } from '@mui/material'
import { Unit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Control, UseFormReturn, UseFormSetValue, useWatch } from 'react-hook-form'
import DetailedGES from './DetailedGES'
import MultiplePosts from './MultiplePosts'

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
  detailedGES?: boolean
  error: string
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
  detailedGES,
  error,
  hasParts,
  setHasParts,
  partsCount,
  setPartsCount,
  button,
}: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const tUnit = useTranslations('units')
  const tGlossary = useTranslations('emissionSource.glossary')
  const units = useMemo(() => Object.values(Unit).sort((a, b) => tUnit(a).localeCompare(tUnit(b))), [tUnit])
  const [expandedQuality, setExpandedQuality] = useState(true)
  const [glossary, setGlossary] = useState('')
  const control = form.control as Control<EmissionFactorCommand>
  const setValue = form.setValue as UseFormSetValue<EmissionFactorCommand>

  const update = (column: (typeof qualityKeys)[number], value: string | number | boolean) => {
    if (typeof value === 'number') {
      setValue(column, value)
    }
  }

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
        translation={t}
        name="name"
        label={t('name')}
        placeholder={t('namePlaceholder')}
      />
      <FormTextField control={control} translation={t} name="attribute" label={t('attribute')} />
      <FormTextField
        data-testid="emission-factor-source"
        control={control}
        translation={t}
        name="source"
        label={t('source')}
      />
      <FormSelect data-testid="emission-factor-unit" control={control} translation={t} label={t('unit')} name="unit">
        {units.map((unit) => (
          <MenuItem key={unit} value={unit}>
            {tUnit(unit)}
          </MenuItem>
        ))}
      </FormSelect>
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
        canShrink
        control={control}
        emissionSource={quality}
        update={update as (key: keyof EmissionFactorQuality, value: string | number | boolean) => void}
        advanced={false}
        setGlossary={setGlossary}
        expanded={expandedQuality}
        setExpanded={setExpandedQuality}
        defaultQuality={qualityKeys.map((qualityKey) => quality[qualityKey]).find((quality) => !!quality)}
      />
      <MultiplePosts form={form} context="emissionFactor" />
      <FormTextField control={control} translation={t} name="comment" label={t('comment')} multiline rows={2} />
      <div className={classNames({ ['justify-between']: button === 'update' })}>
        {button === 'update' && (
          <LinkButton data-testid="emission-factor-cancel-update" href="/facteurs-d-emission">
            {t('cancel')}
          </LinkButton>
        )}
        <LoadingButton type="submit" loading={form.formState.isSubmitting} data-testid="emission-factor-valid-button">
          {t(button)}
        </LoadingButton>
      </div>
      {error && <p>{error}</p>}
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
