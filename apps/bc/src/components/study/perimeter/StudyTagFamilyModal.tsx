import { createOrUpdateStudyTagFamily, deleteStudyTagFamily } from '@/services/serverFunctions/emissionSource'
import {
  NewStudyTagFamilyCommand,
  NewStudyTagFamilyCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import Form from '@abc-transitionbascarbone/application/components/base/Form'
import LoadingButton from '@abc-transitionbascarbone/application/components/base/LoadingButton'
import { FormTextField } from '@abc-transitionbascarbone/application/components/form/TextField'
import { Button, useToast } from '@abc-transitionbascarbone/application/ui'
import { StudyTagFamily } from '@abc-transitionbascarbone/db'
import { customRich } from '@abc-transitionbascarbone/shared/utils/customRich'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'

interface Props {
  studyId?: string
  family: Partial<StudyTagFamily> | undefined
  onClose: () => void
  action: 'edit' | 'delete'
}

const StudyTagFamilyModal = ({ action, studyId, family, onClose }: Props) => {
  const t = useTranslations('study.perimeter.family')
  const tError = useTranslations('error')
  const { showErrorToast } = useToast()
  const { getValues, control, handleSubmit, formState } = useForm<NewStudyTagFamilyCommand>({
    resolver: zodResolver(NewStudyTagFamilyCommandValidation),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      name: family?.name,
      id: family?.id,
    },
  })

  const onSubmit = async () => {
    if (action === 'edit' && studyId) {
      const values = getValues()
      const result = await createOrUpdateStudyTagFamily(studyId, values.name, family?.id)
      if (!result.success) {
        showErrorToast(tError('Not authorized'))
      }
    } else if (action === 'delete' && family?.id && studyId) {
      const result = await deleteStudyTagFamily(studyId, family.id)
      if (!result.success) {
        showErrorToast(tError('Not authorized'))
      }
    }
    onClose()
  }

  const title = action === 'edit' ? (family ? 'edit' : 'new') : 'delete'
  const content = action === 'edit' ? 'content' : 'deleteContent'

  return (
    <Dialog open aria-labelledby="emission-tag-family-title" aria-describedby="emission-tag-family-description">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle id="emission-tag-family-modal-title">{t(title)}</DialogTitle>
        <DialogContent id="emission-tag-family-modal-content">
          {customRich(t, content, { name: family?.name || '' })}
          {action === 'edit' && (
            <div className="flex mt1">
              <FormTextField
                className="grow"
                control={control}
                name="name"
                label={t('name')}
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

export default StudyTagFamilyModal
