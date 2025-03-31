import { DeleteCommand } from '@/services/serverFunctions/study.command'
import { handleWarningText } from '@/utils/components'
import { Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Control, UseFormReturn, useWatch } from 'react-hook-form'
import Button from '../base/Button'
import Form from '../base/Form'
import LoadingButton from '../base/LoadingButton'
import { FormTextField } from '../form/TextField'
import styles from './Modal.module.css'

interface Props<T extends DeleteCommand> {
  form: UseFormReturn<T>
  type: 'organization' | 'study'
  onDelete: () => void
  onClose: () => void
  t: ReturnType<typeof useTranslations>
  error?: string
}

const contactMail = process.env.NEXT_PUBLIC_ABC_SUPPORT_MAIL

const DeletionModal = <T extends DeleteCommand>({ form, type, onDelete, onClose, t, error }: Props<T>) => {
  const control = form.control as Control<DeleteCommand>
  const disabled = !useWatch(form).name
  return (
    <Dialog open aria-labelledby={`delete-${type}-title`} aria-describedby={`delete-${type}-description`}>
      <Form onSubmit={form.handleSubmit(onDelete)}>
        <DialogTitle id={`delete-${type}-modale-title`}>{t('title')}</DialogTitle>
        <DialogContent id={`delete-${type}-modale-content`}>
          {handleWarningText(t, 'content')}
          <div className="flex mt1">
            <FormTextField
              className="grow"
              control={control}
              name="name"
              label={t('name')}
              translation={t}
              data-testid={`delete-${type}-name-field`}
            />
          </div>
          {error && (
            <p data-testid={`${type}-deletion-error`} className={styles.error}>
              {t.rich(error, {
                support: (children) => (
                  <Link className={styles.error} href={`mailto:${contactMail}`}>
                    {children}
                  </Link>
                ),
              })}
            </p>
          )}
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
