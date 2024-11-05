import React from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'
import Form from '@/components/base/Form'

interface DetailedGESFieldsProps {
  form: UseFormReturn<CreateEmissionCommand>
  index: number
}

const DetailedGESFields = ({ form, index }: DetailedGESFieldsProps) => {
  const t = useTranslations('emissions.create')
  return (
    <Form>
      <FormTextField
        data-testid="new-emission-co2f"
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`co2f.${index}`}
        label={t('co2f')}
      />
      <FormTextField
        data-testid="new-emission-ch4f"
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`ch4f.${index}`}
        label={t('ch4f')}
      />
      <FormTextField
        data-testid="new-emission-ch4b"
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`ch4b.${index}`}
        label={t('ch4b')}
      />
      <FormTextField
        data-testid="new-emission-n2o"
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`n2o.${index}`}
        label={t('n2o')}
      />
      <FormTextField
        data-testid="new-emission-co2b"
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`co2b.${index}`}
        label={t('co2b')}
      />
      <FormTextField
        data-testid="new-emission-sf6"
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`sf6.${index}`}
        label={t('sf6')}
      />
      <FormTextField
        data-testid="new-emission-hfc"
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`hfc.${index}`}
        label={t('hfc')}
      />
      <FormTextField
        data-testid="new-emission-pfc"
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`pfc.${index}`}
        label={t('pfc')}
      />
      <FormTextField
        data-testid="new-emission-otherGES"
        control={form.control}
        translation={t}
        slotProps={{ htmlInput: { min: 0 } }}
        type="number"
        name={`otherGES.${index}`}
        label={t('otherGES')}
      />
    </Form>
  )
}

export default DetailedGESFields
