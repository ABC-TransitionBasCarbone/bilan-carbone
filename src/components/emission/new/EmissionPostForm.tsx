import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { FormTextField } from '@/components/form/TextField'
import { PostType } from '@prisma/client'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'
import { Accordion, AccordionDetails, AccordionSummary, MenuItem } from '@mui/material'
import DetailedGESFields from './DetailedGESForm'
import { FormSelect } from '@/components/form/Select'

interface DetailedGESFieldsProps {
  form: UseFormReturn<CreateEmissionCommand>
  detailedGES: boolean
  totalCo2?: number
  index: number
}

const EmissionPostForm = ({ detailedGES, form, index }: DetailedGESFieldsProps) => {
  const t = useTranslations('emissions.create')
  const tPostType = useTranslations('postType')

  const header = form.watch(`posts.${index}.name`) || `post ${index + 1}`
  const totalCo2 = form.watch(`posts.${index}.totalCo2`) || 0

  const posttTypes = useMemo(
    () => Object.values(PostType).sort((a, b) => tPostType(a).localeCompare(tPostType(b))),
    [t],
  )

  // const emissionValues = form.watch([
  //   `ch4b.${index}`,
  //   `ch4f.${index}`,
  //   `co2b.${index}`,
  //   `co2f.${index}`,
  //   `n2o.${index}`,
  //   `sf6.${index}`,
  //   `hfc.${index}`,
  //   `pfc.${index}`,
  //   `otherGES.${index}`,
  // ])

  return (
    <Accordion key={index}>
      <AccordionSummary expandIcon={<>+</>}>{header}</AccordionSummary>
      <AccordionDetails className="flex-col">
        <div className="flex" style={{ gap: '1rem' }}>
          <FormTextField
            data-testid={`new-emission-post-${index}-name`}
            control={form.control}
            translation={t}
            type="string"
            name={`posts.${index}.name`}
            label={t('name')}
          />
          <FormSelect
            data-testid={`post${index}-type`}
            control={form.control}
            translation={t}
            label={t('postType')}
            name={`posts.${index}.type`}
            style={{ minWidth: '10rem' }}
          >
            {posttTypes.map((postType) => (
              <MenuItem key={postType} value={postType}>
                {tPostType(postType)}
              </MenuItem>
            ))}
          </FormSelect>
        </div>

        {detailedGES ? (
          <DetailedGESFields detailedGES={detailedGES} control={form.control} index={index} />
        ) : (
          <FormTextField
            data-testid="new-emission-totalCo2"
            control={form.control}
            translation={t}
            slotProps={{
              htmlInput: { min: 0 },
              inputLabel: { shrink: detailedGES || totalCo2 !== undefined ? true : undefined },
            }}
            type="number"
            name={`posts.${index}.totalCo2`}
            label={t('totalCo2')}
          />
        )}
      </AccordionDetails>
    </Accordion>
  )
}

export default EmissionPostForm
