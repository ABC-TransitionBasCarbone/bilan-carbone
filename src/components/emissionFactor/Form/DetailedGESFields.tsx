import { FormTextField } from '@/components/form/TextField'
import { gazKeys } from '@/constants/emissions'
import { CreateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, FieldPath, UseFormReturn } from 'react-hook-form'
import styles from './DetailedGESFields.module.css'

interface Props<T extends CreateEmissionFactorCommand> {
  form: UseFormReturn<T>
  index?: number
}

const DetailedGESFields = <T extends CreateEmissionFactorCommand>({ form, index }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const control = form.control as Control<CreateEmissionFactorCommand>
  const getName = (gaz: string) =>
    `${index !== undefined ? `parts.${index}.` : ''}${gaz}` as FieldPath<CreateEmissionFactorCommand>
  const getTestId = (gaz: string) => `emission-factor-${index !== undefined ? `part-${index}-` : ''}${gaz}`
  return (
    <div className={classNames(styles.gases, 'flex')}>
      {gazKeys.map((gaz) => (
        <FormTextField
          key={getName(gaz)}
          data-testid={getTestId(gaz)}
          control={control}
          translation={t}
          slotProps={{
            htmlInput: { min: 0 },
            input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
          }}
          type="number"
          name={getName(gaz)}
          label={t(gaz)}
        />
      ))}
    </div>
  )
}

export default DetailedGESFields
