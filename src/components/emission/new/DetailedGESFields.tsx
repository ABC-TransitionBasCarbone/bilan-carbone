import { FieldPath, UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'
import { gazKeys } from '@/constants/emissions'

interface DetailedGESFieldsProps {
  form: UseFormReturn<CreateEmissionCommand>
  multiple?: boolean
  index: number
}

const DetailedGESFields = ({ form, index, multiple }: DetailedGESFieldsProps) => {
  const t = useTranslations('emissions.create')
  const getName = (gaz: string) => `${multiple ? `parts.${index}.` : ''}${gaz}` as FieldPath<CreateEmissionCommand>
  const getTestId = (gaz: string) => `new-emission-${multiple ? `part-${index}-` : ''}${gaz}`
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
