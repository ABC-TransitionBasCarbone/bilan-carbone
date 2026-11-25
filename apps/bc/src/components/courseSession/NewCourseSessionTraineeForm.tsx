'use client'

import { addCourseSessionTrainee } from '@/services/serverFunctions/courseSession'
import {
  AddCourseSessionTraineeCommand,
  AddCourseSessionTraineeCommandValidation,
} from '@/services/serverFunctions/courseSession.command'
import Form from '@abc-transitionbascarbone/common/components/base/Form'
import LoadingButton from '@abc-transitionbascarbone/common/components/base/LoadingButton'
import { FormTextField } from '@abc-transitionbascarbone/common/components/form/TextField'
import { useServerFunction } from '@abc-transitionbascarbone/common/components/hooks/useServerFunction'
import Modal from '@abc-transitionbascarbone/common/components/modals/Modal'
import { useToast } from '@abc-transitionbascarbone/common/ui'
import { zodResolver } from '@hookform/resolvers/zod'
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

interface Props {
  sessionId: string
}

const successMessageKeys = {
  added: 'traineeAdded',
  alreadyRegistered: 'traineeAlreadyInSession',
  transferred: 'traineeTransferred',
} as const

const NewCourseSessionTraineeForm = ({ sessionId }: Props) => {
  const t = useTranslations('courseSessions')
  const tMember = useTranslations('newMember')
  const tAction = useTranslations('common.action')
  const router = useRouter()
  const { callServerFunction } = useServerFunction()
  const { showSuccessToast } = useToast()
  const [pendingTransfer, setPendingTransfer] = useState<{
    command: AddCourseSessionTraineeCommand
    sessionIds: string[]
  } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const form = useForm<AddCourseSessionTraineeCommand>({
    resolver: zodResolver(AddCourseSessionTraineeCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { lastName: '', firstName: '', email: '' },
  })

  const onSubmit = async (command: AddCourseSessionTraineeCommand) => {
    const result = await callServerFunction(() => addCourseSessionTrainee(sessionId, command), {
      getErrorMessage: (message) => (t.has(message) ? t(message) : ''),
    })
    if (!result.success) {
      return
    }
    if (result.data.status === 'confirmationRequired') {
      setPendingTransfer({ command, sessionIds: result.data.sessionIds })
      return
    }
    setPendingTransfer(null)
    showSuccessToast(t(successMessageKeys[result.data.status]))
    router.push(`/sessions/${sessionId}/formees`)
    router.refresh()
  }

  const closeTransfer = () => {
    if (!isConfirming) {
      setPendingTransfer(null)
    }
  }

  const confirmTransfer = async () => {
    if (!pendingTransfer || isConfirming) {
      return
    }
    setIsConfirming(true)
    try {
      await onSubmit({ ...pendingTransfer.command, confirmedTransferFrom: pendingTransfer.sessionIds })
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <>
      <Form onSubmit={form.handleSubmit(onSubmit)}>
        <FormTextField
          data-testid="new-trainee-lastName"
          control={form.control}
          name="lastName"
          label={tMember('lastName')}
          disabled={form.formState.isSubmitting || !!pendingTransfer}
        />
        <FormTextField
          data-testid="new-trainee-firstName"
          control={form.control}
          name="firstName"
          label={tMember('firstName')}
          disabled={form.formState.isSubmitting || !!pendingTransfer}
        />
        <FormTextField
          data-testid="new-trainee-email"
          type="email"
          control={form.control}
          name="email"
          label={tMember('email')}
          disabled={form.formState.isSubmitting || !!pendingTransfer}
          trim
        />
        <LoadingButton
          type="submit"
          loading={form.formState.isSubmitting}
          disabled={!!pendingTransfer}
          startIcon={<PersonAddOutlinedIcon />}
          data-testid="new-trainee-create-button"
        >
          {t('addTrainee')}
        </LoadingButton>
      </Form>
      <Modal
        open={!!pendingTransfer}
        label="trainee-transfer"
        title={t('transferTraineeTitle')}
        onClose={closeTransfer}
        actions={[
          {
            actionType: 'button',
            children: tAction('cancel'),
            onClick: closeTransfer,
            disabled: isConfirming,
            'data-testid': 'trainee-transfer-cancel',
          },
          {
            actionType: 'loadingButton',
            children: tAction('confirm'),
            onClick: confirmTransfer,
            loading: isConfirming,
            disabled: isConfirming,
            'data-testid': 'trainee-transfer-confirm',
          },
        ]}
      >
        {pendingTransfer &&
          t('transferTraineeDescription', {
            firstName: pendingTransfer.command.firstName,
            lastName: pendingTransfer.command.lastName,
            email: pendingTransfer.command.email,
          })}
      </Modal>
    </>
  )
}

export default NewCourseSessionTraineeForm
