import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { FormTextField } from '@/components/form/TextField'

interface DetailedGESFieldsProps {
  control: Control<any> // Remplace `any` par ton type de données si possible pour plus de sécurité
  translation: any
  detailedGES: boolean
  totalCo2?: number
}

const DetailedGESFields = ({ control, translation: t, detailedGES, totalCo2 }: DetailedGESFieldsProps) => {
  return (
    <>
      {detailedGES && (
        <>
          <FormTextField
            data-testid="new-emission-co2f"
            control={control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="co2f"
            label={t('co2f')}
          />
          <FormTextField
            data-testid="new-emission-ch4f"
            control={control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="ch4f"
            label={t('ch4f')}
          />
          <FormTextField
            data-testid="new-emission-ch4b"
            control={control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="ch4b"
            label={t('ch4b')}
          />
          <FormTextField
            data-testid="new-emission-n2o"
            control={control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="n2o"
            label={t('n2o')}
          />
          <FormTextField
            data-testid="new-emission-co2b"
            control={control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="co2b"
            label={t('co2b')}
          />
          <FormTextField
            data-testid="new-emission-sf6"
            control={control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="sf6"
            label={t('sf6')}
          />
          <FormTextField
            data-testid="new-emission-hfc"
            control={control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="hfc"
            label={t('hfc')}
          />
          <FormTextField
            data-testid="new-emission-pfc"
            control={control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="pfc"
            label={t('pfc')}
          />
          <FormTextField
            data-testid="new-emission-otherGES"
            control={control}
            translation={t}
            slotProps={{ htmlInput: { min: 0 } }}
            type="number"
            name="otherGES"
            label={t('otherGES')}
          />
        </>
      )}
      <FormTextField
        disabled={detailedGES}
        data-testid="new-emission-totalCo2"
        control={control}
        translation={t}
        slotProps={{
          htmlInput: { min: 0 },
          inputLabel: { shrink: detailedGES || totalCo2 !== undefined ? true : undefined },
        }}
        type="number"
        name="totalCo2"
        label={t('totalCo2')}
      />
    </>
  )
}

export default DetailedGESFields
