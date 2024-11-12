import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import styles from './EmissionPostForm.module.css'
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

const EmissionPostForm = ({ detailedGES, form, index }: DetailedGESFieldsProps) => {
  const t = useTranslations('emissions.create')

  const header = form.watch(`posts.${index}.name`) || `${t('part')} ${index + 1}`

  return (
    <Accordion>
      <AccordionSummary
        id={`emission-post-${index}-summary`}
        aria-controls={`emission-post-${index}`}
        data-testid={`emission-post-${index}-header`}
        expandIcon={
          <div data-testid={`emission-post-${index}-expand`}>
            <ExpandIcon />
          </div>
        }
      >
        {header}
      </AccordionSummary>
      <AccordionDetails className={classNames(styles.accordionDetails, 'flex-col')}>
        <div className={classNames(styles.accordionDetailsHeader, 'flex')}>
          <FormTextField
            data-testid={`new-emission-post-${index}-name`}
            control={form.control}
            translation={t}
            type="string"
            name={`posts.${index}.name`}
            label={t('name')}
          />
          <FormTextField
            data-testid={`new-emission-post-${index}-type`}
            control={form.control}
            translation={t}
            type="string"
            name={`posts.${index}.type`}
            label={t('postType')}
          />
        </div>

        {detailedGES && <DetailedGESFields form={form} index={index} multiple />}
        <FormTextField
          disabled={detailedGES}
          data-testid={`new-emission-post-${index}-totalCo2`}
          control={form.control}
          translation={t}
          slotProps={{
            htmlInput: { min: 0 },
            inputLabel: { shrink: true },
          }}
          type="number"
          name={`posts.${index}.totalCo2`}
          label={t('totalCo2')}
        />
      </AccordionDetails>
    </Accordion>
  )
}

export default EmissionPostForm
