import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import styles from './EmissionPartForm.module.css'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import ExpandIcon from '@mui/icons-material/ExpandMore'
import DetailedGESFields from './DetailedGESFields'
import { FormTextField } from '@/components/form/TextField'
import classNames from 'classnames'

interface DetailedGESFieldsProps {
  form: UseFormReturn<CreateEmissionCommand>
  detailedGES: boolean
  index: number
}

const EmissionPartForm = ({ detailedGES, form, index }: DetailedGESFieldsProps) => {
  const t = useTranslations('emissions.create')

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

        {detailedGES && <DetailedGESFields form={form} index={index} multiple />}
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

export default EmissionPartForm
