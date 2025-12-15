import { FormTextField } from '@/components/form/TextField'
import { ActionStepCommand, AddActionCommand } from '@/services/serverFunctions/transitionPlan.command'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Delete, DragIndicator } from '@mui/icons-material'
import { Box, IconButton } from '@mui/material'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { Control, FieldErrors } from 'react-hook-form'
import styles from './ActionStepsList.module.css'

interface Props {
  step: ActionStepCommand
  index: number
  control: Control<AddActionCommand>
  onDelete: (index: number) => void
  errors: FieldErrors<AddActionCommand>
}

export const ActionStep = ({ step, index, control, onDelete }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: step?.id || `step-${index}`,
  })

  const styleProps = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  if (!step) {
    return null
  }

  return (
    <Box
      ref={setNodeRef}
      style={styleProps}
      className={classNames(styles.stepBlock, 'flex-col py-2 px1')}
      {...attributes}
      {...listeners}
    >
      <Box className={classNames('flex justify-between align-center mb-2')}>
        <Box className={classNames('flex align-center')}>
          <Box className={classNames(styles.dragHandle, 'flex align-center')}>
            <DragIndicator fontSize="small" />
          </Box>
          <Box className={styles.stepNumber}>{index + 1}</Box>
        </Box>
        <IconButton size="small" onClick={() => onDelete(index)} onPointerDown={(e) => e.stopPropagation()}>
          <Delete fontSize="small" />
        </IconButton>
      </Box>
      <Box
        className={classNames('flex-col gapped-2 grow')}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <FormTextField
          control={control}
          name={`steps.${index}.title`}
          fullWidth
          placeholder={t('stepTitlePlaceholder')}
          defaultValue={step.title || ''}
          multiline
          expandable={false}
          maxRows={2}
        />
      </Box>
    </Box>
  )
}
