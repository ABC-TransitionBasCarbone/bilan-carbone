import { customRich } from '@/i18n/customRich'
import { createOrUpdateStudyTagFamily, deleteStudyTagFamily } from '@/services/serverFunctions/emissionSource'
import {
  NewStudyTagFamilyCommand,
  NewStudyTagFamilyCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { StudyTagFamily } from '@prisma/client'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import Button from '../../base/Button'
import Form from '../../base/Form'
import LoadingButton from '../../base/LoadingButton'
import { FormTextField } from '../../form/TextField'

interface Props {
  studyId?: string
  family: Partial<StudyTagFamily> | undefined
  onClose: () => void
  action: 'edit' | 'delete'
}

const StudyTagFamilyModal = ({ action, studyId, family, onClose }: Props) => {
  const t = useTranslations('study.perimeter.family')
  const { getValues, control, handleSubmit, formState } = useForm<NewStudyTagFamilyCommand>({
    resolver: zodResolver(NewStudyTagFamilyCommandValidation),
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
      await createOrUpdateStudyTagFamily(studyId, values.name, family?.id)
    } else if (action === 'delete' && family?.id && studyId) {
      await deleteStudyTagFamily(studyId, family.id)
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
