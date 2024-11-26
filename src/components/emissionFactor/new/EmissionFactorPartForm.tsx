import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import ExpandIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import DetailedGESFields from './DetailedGESFields'
import styles from './EmissionFactorPartForm.module.css'

interface DetailedGESFieldsProps {
  form: UseFormReturn<CreateEmissionFactorCommand>
  detailedGES: boolean
  index: number
}

const EmissionFactorPartForm = ({ detailedGES, form, index }: DetailedGESFieldsProps) => {
  const t = useTranslations('emissionFactors.create')

  const header = form.watch(`parts.${index}.name`) || `${t('part')} ${index + 1}`

  return (
    <Accordion>
      <AccordionSummary
        id={`emission-part-${index}-summary`}
        aria-controls={`emission-part-${index}`}
        data-testid={`emission-part-${index}-header`}
        expandIcon={
          <div data-testid={`emission-part-${index}-expand`}>
            <ExpandIcon />
          </div>
        }
      >
        {header}
      </AccordionSummary>
      <AccordionDetails className={classNames(styles.accordionDetails, 'flex-col')}>
        <div className={classNames(styles.accordionDetailsHeader, 'flex')}>
          <FormTextField
            data-testid={`new-emission-part-${index}-name`}
            control={form.control}
            translation={t}
            type="string"
            name={`parts.${index}.name`}
            label={t('name')}
          />
          <FormTextField
            data-testid={`new-emission-part-${index}-type`}
            control={form.control}
            translation={t}
            type="string"
            name={`parts.${index}.type`}
            label={t('partType')}
          />
        </div>

        {detailedGES && <DetailedGESFields form={form} index={index} />}
        <FormTextField
          disabled={detailedGES}
          data-testid={`new-emission-part-${index}-totalCo2`}
          control={form.control}
          translation={t}
          slotProps={{
            htmlInput: { min: 0 },
            inputLabel: { shrink: true },
          }}
          type="number"
          name={`parts.${index}.totalCo2`}
          label={t('totalCo2')}
        />
      </AccordionDetails>
    </Accordion>
  )
}

export default EmissionFactorPartForm
