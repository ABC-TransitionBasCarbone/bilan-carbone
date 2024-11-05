/* eslint-disable react-hooks/exhaustive-deps */
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import styles from './EmissionPostForm.module.css'
import { PostType } from '@prisma/client'
import { CreateEmissionCommand } from '@/services/serverFunctions/emission.command'
import { Accordion, AccordionDetails, AccordionSummary, MenuItem } from '@mui/material'
import DetailedGESFields from './DetailedGESFields'
import { FormTextField } from '@/components/form/TextField'
import { FormSelect } from '@/components/form/Select'
import classNames from 'classnames'

interface DetailedGESFieldsProps {
  form: UseFormReturn<CreateEmissionCommand>
  detailedGES: boolean
  totalCo2?: number
  index: number
}

const EmissionPostForm = ({ detailedGES, form, index }: DetailedGESFieldsProps) => {
  const t = useTranslations('emissions.create')
  const tPostType = useTranslations('emissions.postType')

  const header = form.watch(`posts.${index}.name`) || `${t('post')} ${index + 1}`
  const totalCo2 = form.watch(`posts.${index}.totalCo2`) || 0

  const postTypes = useMemo(() => Object.values(PostType).sort((a, b) => tPostType(a).localeCompare(tPostType(b))), [t])

  return (
    <Accordion>
      <AccordionSummary expandIcon={<>+</>}>{header}</AccordionSummary>
      <AccordionDetails className="flex-col">
        <div className={classNames(styles['accordion-details-header'], 'flex')}>
          <FormTextField
            data-testid={`new-emission-post-${index}-name`}
            control={form.control}
            translation={t}
            type="string"
            name={`posts.${index}.name`}
            label={t('name')}
          />
          <FormSelect
            data-testid={`post-${index}-type`}
            className={styles['accordion-details-type-selector']}
            control={form.control}
            translation={t}
            label={t('postType')}
            name={`posts.${index}.type`}
          >
            {postTypes.map((postType) => (
              <MenuItem key={postType} value={postType}>
                {tPostType(postType)}
              </MenuItem>
            ))}
          </FormSelect>
        </div>

        {detailedGES ? (
          <DetailedGESFields form={form} index={index} />
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
