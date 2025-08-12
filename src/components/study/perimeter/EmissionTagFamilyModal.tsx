import {
  NewEmissionSourceTagFamilyCommand,
  NewEmissionSourceTagFamilyCommandValidation,
} from '@/services/serverFunctions/emissionSource.command'
import { createOrUpdateEmissionSourceTagFamily } from '@/services/serverFunctions/study'
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
  studyId: string
  family: Partial<EmissionSourceTagFamily> | undefined
  onClose: () => void
}

const EmissionTagFamilyModal = ({ studyId, family, onClose }: Props) => {
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
    const values = getValues()
    await createOrUpdateEmissionSourceTagFamily(studyId, values.name, family?.id)
    onClose()
  }

  const title = family ? 'edit' : 'new'

  return (
    <Dialog open aria-labelledby="emission-tag-family-title" aria-describedby="emission-tag-family-description">
      <Form onSubmit={handleSubmit(onSumbit)}>
        <DialogTitle id="emission-tag-family-modal-title">{t(title)}</DialogTitle>
        <DialogContent id="emission-tag-family-modal-content">
          {t('content')}
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
