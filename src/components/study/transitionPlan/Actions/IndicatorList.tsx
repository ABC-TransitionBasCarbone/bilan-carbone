import { FormTextField } from '@/components/form/TextField'
import { AddActionCommand } from '@/services/serverFunctions/transitionPlan.command'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { IconButton, Typography } from '@mui/material'
import { ActionIndicatorType } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { Control, useFieldArray, UseFormSetValue } from 'react-hook-form'

interface Props {
  control: Control<AddActionCommand>
  setValue: UseFormSetValue<AddActionCommand>
  type: ActionIndicatorType
  label: string
}

const IndicatorList = ({ control, type, label }: Props) => {
  const t = useTranslations('study.transitionPlan.actions.addModal')
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'indicators',
  })

  const typeFields = fields.filter((field) => field.type === type)

  const handleAddIndicator = () => {
    append({
      type,
      description: '',
    })
  }

  const handleRemoveIndicator = (localIndex: number) => {
    const fieldToRemove = typeFields[localIndex]
    const globalIndex = fields.findIndex((f) => f.id === fieldToRemove.id)
    if (globalIndex !== -1) {
      remove(globalIndex)
    }
  }

  return (
    <div className={'flex-col gapped025'}>
      <div className={'flex-cc justify-between'}>
        <span className="inputLabel bold">{label}</span>
        <IconButton onClick={handleAddIndicator} size="small" color="primary" aria-label={t('addIndicator')}>
          <AddIcon />
        </IconButton>
      </div>
      {typeFields.length === 0 && (
        <Typography color="textSecondary" fontStyle="italic">
          {t('noIndicators')}
        </Typography>
      )}
      {typeFields.map((field, index) => {
        const globalIndex = fields.findIndex((f) => f.id === field.id)
        return (
          <div key={field.id} className={'flex-cc gapped025'}>
            <FormTextField
              control={control}
              name={`indicators.${globalIndex}.description`}
              placeholder={t('indicatorDescriptionPlaceholder')}
              fullWidth
              data-testid={`indicator-${type}-${index}`}
            />
            <IconButton
              onClick={() => handleRemoveIndicator(index)}
              size="small"
              color="error"
              aria-label={t('removeIndicator')}
            >
              <DeleteIcon />
            </IconButton>
          </div>
        )
      })}
    </div>
  )
}

export default IndicatorList
