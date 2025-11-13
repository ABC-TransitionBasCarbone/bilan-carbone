import { DeleteCommand } from '@/services/serverFunctions/study.command'
import { Translations } from '@/types/translation'
import { handleWarningText } from '@/utils/components'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { Control, UseFormReturn, useWatch } from 'react-hook-form'
import Button from '../base/Button'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'

interface Props<T extends DeleteCommand> {
  form: UseFormReturn<T>
  type: 'organization' | 'study'
  onDelete: () => void
  onClose: () => void
  t: Translations
}

const DeletionModal = <T extends DeleteCommand>({ form, type, onDelete, onClose, t }: Props<T>) => {
  const control = form.control as Control<DeleteCommand>
  const disabled = !useWatch(form).name
  return (
    <Dialog open aria-labelledby={`delete-${type}-title`} aria-describedby={`delete-${type}-description`}>
      <Form onSubmit={form.handleSubmit(onDelete)}>
        <DialogTitle id={`delete-${type}-modal-title`}>{t('title')}</DialogTitle>
        <DialogContent id={`delete-${type}-modal-content`}>
          {handleWarningText(t, 'content')}
          <div className="flex mt1">
            <FormTextField
              className="grow"
              control={control}
              name="name"
              label={t('name')}
              data-testid={`delete-${type}-name-field`}
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('cancel')}</Button>
          <LoadingButton
            type="submit"
            loading={form.formState.isSubmitting}
            disabled={disabled}
            data-testid={`confirm-${type}-deletion`}
          >
            {t('confirm')}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  )
}

export default DeletionModal
