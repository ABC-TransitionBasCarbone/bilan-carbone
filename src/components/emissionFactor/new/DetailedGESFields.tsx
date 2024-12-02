import { FormTextField } from '@/components/form/TextField'
import { gazKeys } from '@/constants/emissions'
import { CreateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { FieldPath, UseFormReturn } from 'react-hook-form'
import styles from './DetailedGESFields.module.css'

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
    <div className={classNames(styles.gases, 'flex')}>
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
    </div>
  )
}

export default DetailedGESFields
