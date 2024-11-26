import { FormTextField } from '@/components/form/TextField'
import { gazKeys } from '@/constants/emissions'
import { CreateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import { useTranslations } from 'next-intl'
import { FieldPath, UseFormReturn } from 'react-hook-form'

interface DetailedGESFieldsProps {
  form: UseFormReturn<CreateEmissionFactorCommand>
  index?: number
}

const DetailedGESFields = ({ form, index }: DetailedGESFieldsProps) => {
  const t = useTranslations('emissionFactors.create')
  const getName = (gaz: string) =>
    `${index !== undefined ? `parts.${index}.` : ''}${gaz}` as FieldPath<CreateEmissionFactorCommand>
  const getTestId = (gaz: string) => `new-emission-${index !== undefined ? `part-${index}-` : ''}${gaz}`
  return (
    <>
      {gazKeys.map((gaz) => (
        <FormTextField
          key={getName(gaz)}
          data-testid={getTestId(gaz)}
          control={form.control}
          translation={t}
          slotProps={{ htmlInput: { min: 0 } }}
          type="number"
          name={getName(gaz)}
          label={t(gaz)}
        />
      ))}
    </>
  )
}

export default DetailedGESFields
