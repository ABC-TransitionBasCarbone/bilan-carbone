import {
  createOrUpdateEmissionSourceTagFamily,
  deleteEmissionSourceTagFamily,
} from '@/services/serverFunctions/emissionSource'
import {
  NewEmissionSourceTagFamilyCommand,
  NewEmissionSourceTagFamilyCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { EmissionSourceTagFamily } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import Button from '../../base/Button'
import Form from '../../base/Form'
import LoadingButton from '../../base/LoadingButton'
import { FormTextField } from '../../form/TextField'

interface Props {
  studyId?: string
  family: Partial<EmissionSourceTagFamily> | undefined
  onClose: () => void
  action: 'edit' | 'delete'
}

const EmissionTagFamilyModal = ({ action, studyId, family, onClose }: Props) => {
  const t = useTranslations('study.perimeter.family')
  const { getValues, control, handleSubmit, formState } = useForm<NewEmissionSourceTagFamilyCommand>({
    resolver: zodResolver(NewEmissionSourceTagFamilyCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: family?.name,
      id: family?.id,
    },
  })

  const onSumbit = async () => {
    if (action === 'edit' && studyId) {
      const values = getValues()
      await createOrUpdateEmissionSourceTagFamily(studyId, values.name, family?.id)
    } else if (action === 'delete' && family?.id && studyId) {
      await deleteEmissionSourceTagFamily(studyId, family.id)
    }
    onClose()
  }

  const title = action === 'edit' ? (family ? 'edit' : 'new') : 'delete'
  const content = action === 'edit' ? 'content' : 'deleteContent'

  return (
    <Dialog open aria-labelledby="emission-tag-family-title" aria-describedby="emission-tag-family-description">
      <Form onSubmit={handleSubmit(onSumbit)}>
        <DialogTitle id="emission-tag-family-modal-title">{t(title)}</DialogTitle>
        <DialogContent id="emission-tag-family-modal-content">
          {t.rich(content, { name: family?.name || '', red: (children) => <span className="error">{children}</span> })}
          {action === 'edit' && (
            <div className="flex mt1">
              <FormTextField
                className="grow"
                control={control}
                name="name"
                label={t('name')}
                translation={t}
                data-testid="emission-tag-family-name-field"
                fullWidth
              />
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('cancel')}</Button>
          <LoadingButton
            type="submit"
            loading={formState.isSubmitting}
            disabled={!formState.isValid}
            data-testid="confirm-emission-tag-family"
          >
            {t('confirm')}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  )
}

export default EmissionTagFamilyModal
