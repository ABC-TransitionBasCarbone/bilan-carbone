import Button from '@/components/base/Button'
import { FormTextField } from '@/components/form/TextField'
import { CreateEmissionFactorCommand } from '@/services/serverFunctions/emissionFactor.command'
import CloseIcon from '@mui/icons-material/Close'
import ExpandIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, UseFormReturn } from 'react-hook-form'
import DetailedGESFields from './DetailedGESFields'
import styles from './EmissionFactorPartForm.module.css'

interface Props<T extends CreateEmissionFactorCommand> {
  form: UseFormReturn<T>
  detailedGES: boolean
  deletePart: (i: number) => void
  partsCount: number
  index: number
}

const EmissionFactorPartForm = <T extends CreateEmissionFactorCommand>({
  detailedGES,
  form,
  deletePart,
  partsCount,
  index,
}: Props<T>) => {
  const t = useTranslations('emissionFactors.create')

  const control = form.control as Control<CreateEmissionFactorCommand>
  const header =
    (form as UseFormReturn<CreateEmissionFactorCommand>).watch(`parts.${index}.name`) || `${t('part')} ${index + 1}`

  return (
    <div data-testid="emission-part-row" className="flex">
      <Accordion className="grow">
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
              data-testid={`emission-factor-part-${index}-name`}
              control={control}
              translation={t}
              type="string"
              name={`parts.${index}.name`}
              label={t('name')}
            />
            <FormTextField
              data-testid={`emission-factor-part-${index}-type`}
              control={control}
              translation={t}
              type="string"
              name={`parts.${index}.type`}
              label={t('partType')}
            />
          </div>

          {detailedGES && <DetailedGESFields form={form} index={index} />}
          <FormTextField
            disabled={detailedGES}
            data-testid={`emission-factor-part-${index}-totalCo2`}
            control={control}
            translation={t}
            slotProps={{
              htmlInput: { min: 0 },
              inputLabel: { shrink: true },
              input: { onWheel: (event) => (event.target as HTMLInputElement).blur() },
            }}
            type="number"
            name={`parts.${index}.totalCo2`}
            label={t('totalCo2')}
          />
        </AccordionDetails>
      </Accordion>
      <div className={classNames(styles.deleteBtn, 'flex ml1')}>
        <Button
          data-testid={`delete-emission-part-${index}`}
          onClick={() => deletePart(index)}
          disabled={partsCount < 2}
        >
          <CloseIcon />
        </Button>
      </div>
    </div>
  )
}

export default EmissionFactorPartForm
