import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'

interface DetailedGESFieldsProps {
  form: UseFormReturn<CreateEmissionCommand>
  multiple?: boolean
  index: number
}

const DetailedGESFields = ({ form, index, multiple }: DetailedGESFieldsProps) => {
  const t = useTranslations('emissions.create')
  const getTestId = (gaz: string) => `new-emission-${multiple ? `post-${index}-` : ''}${gaz}`
  return (
    <>
      <FormTextField
        data-testid={getTestId('co2f')}
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`co2f.${index}`}
        label={t('co2f')}
      />
      <FormTextField
        data-testid={getTestId('ch4f')}
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`ch4f.${index}`}
        label={t('ch4f')}
      />
      <FormTextField
        data-testid={getTestId('ch4b')}
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`ch4b.${index}`}
        label={t('ch4b')}
      />
      <FormTextField
        data-testid={getTestId('n2o')}
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`n2o.${index}`}
        label={t('n2o')}
      />
      <FormTextField
        data-testid={getTestId('co2b')}
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`co2b.${index}`}
        label={t('co2b')}
      />
      <FormTextField
        data-testid={getTestId('sf6')}
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`sf6.${index}`}
        label={t('sf6')}
      />
      <FormTextField
        data-testid={getTestId('hfc')}
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`hfc.${index}`}
        label={t('hfc')}
      />
      <FormTextField
        data-testid={getTestId('pfc')}
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`pfc.${index}`}
        label={t('pfc')}
      />
      <FormTextField
        data-testid={getTestId('otherGES')}
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`otherGES.${index}`}
        label={t('otherGES')}
      />
    </>
  )
}

export default DetailedGESFields
