import { FormTextField } from '@/components/form/TextField'
import { gazKeys } from '@/constants/emissions'
import { EmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, FieldPath, UseFormReturn } from 'react-hook-form'
import styles from './DetailedGESFields.module.css'

interface Props<T extends EmissionFactorCommand> {
  form: UseFormReturn<T>
  index?: number
}

const DetailedGESFields = <T extends EmissionFactorCommand>({ form, index }: Props<T>) => {
  const t = useTranslations('emissionFactors.create')
  const control = form.control as Control<EmissionFactorCommand>
  const getName = (gaz: string) =>
    `${index !== undefined ? `parts.${index}.` : ''}${gaz}` as FieldPath<EmissionFactorCommand>
  const getTestId = (gaz: string) => `emission-factor-${index !== undefined ? `part-${index}-` : ''}${gaz}`
  return (
    <div className={classNames(styles.gases, 'flex')}>
      {gazKeys.map((gaz) => (
        <FormTextField
          key={getName(gaz)}
          data-testid={getTestId(gaz)}
          control={control}
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
