import { CustomFormLabel } from '@/components/form/CustomFormLabel'
import { AddActionFormCommand } from '@/services/serverFunctions/transitionPlan.command'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable'
import { Add, ArrowRight } from '@mui/icons-material'
import { Box, FormHelperText, IconButton } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, FieldErrors, useFieldArray } from 'react-hook-form'
import { ActionStep } from './ActionStep'
import styles from './ActionStepsList.module.css'

interface Props {
  control: Control<AddActionFormCommand>
  errors: FieldErrors<AddActionFormCommand>
}

const ActionStepsList = ({ control, errors }: Props) => {
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'steps',
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id)
      const newIndex = fields.findIndex((f) => f.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex)
      }
    }
  }

  const handleAdd = () => {
    append({ title: '', order: fields.length })
  }

  const handleDelete = (index: number) => {
    remove(index)
  }

  const t = useTranslations('study.transitionPlan.actions.addModal')

  return (
    <Box className={classNames('flex-col w100')}>
      <CustomFormLabel label={`${t('subSteps')} *`} />
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={rectSortingStrategy}>
          <Box className={classNames('flex wrap align-center w100', styles.stepsContainer)}>
            {fields.flatMap((field, index) => {
              const elements = [
                <ActionStep
                  key={field.id}
                  step={field}
                  index={index}
                  control={control}
                  onDelete={handleDelete}
                  errors={errors}
                />,
              ]
              if ((index + 1) % 3 !== 0) {
                elements.push(<ArrowRight key={`arrow-${field.id}`} />)
              }
              return elements
            })}
            <Box className={classNames(styles.addStepButtonContainer, 'flex-cc')}>
              <IconButton onClick={handleAdd} className={styles.addStepButton}>
                <Add />
              </IconButton>
            </Box>
          </Box>
        </SortableContext>
      </DndContext>
      <FormHelperText error={!!errors.steps?.message}>{errors.steps?.message}</FormHelperText>
    </Box>
  )
}

export default ActionStepsList
