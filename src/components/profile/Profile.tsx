import Logout from '@/components/auth/Logout'
import LocaleSelector from '@/components/navbar/LocaleSelector'
import { updateUserProfile } from '@/services/serverFunctions/user'
import { EditProfileCommand, EditProfileCommandValidation } from '@/services/serverFunctions/user.command'
import { zodResolver } from '@hookform/resolvers/zod'
import CloseIcon from '@mui/icons-material/Close'
import DoneIcon from '@mui/icons-material/Done'
import EditIcon from '@mui/icons-material/Edit'
import classNames from 'classnames'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Button from '../base/Button'
import Form from '../base/Form'
import Spinner from '../base/Spinner'
import { FormTextField } from '../form/TextField'
import styles from './Profile.module.css'

const Profile = () => {
  const { data: session, update } = useSession()

  const t = useTranslations('profile')
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<EditProfileCommand>({
    resolver: zodResolver(EditProfileCommandValidation),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: {
      firstName: session?.user.firstName,
      lastName: session?.user.lastName,
    },
  })

  useEffect(() => {
    form.reset({ firstName: session?.user.firstName, lastName: session?.user.lastName })
  }, [session])

  if (!session || !update) {
    return null
  }

  const onSubmit = async () => {
    form.clearErrors()
    const result = await updateUserProfile(form.getValues())
    if (result) {
      setError(result)
    } else {
      setEditing(false)
      await update(form.getValues())
    }
  }

  const onCancel = () => {
    setEditing(false)
    form.reset()
  }
  return (
    <div className={classNames(styles.gapped, 'grow justify-between')}>
      <div className="grow">
        <div className="mb1">
          {editing ? (
            <Form onSubmit={form.handleSubmit(onSubmit)}>
              <div className={classNames(styles.gapped, 'flex')}>
                <FormTextField
                  data-testid="edit-user-firstName"
                  control={form.control}
                  translation={t}
                  name="firstName"
                  label={t('firstName')}
                />
                <FormTextField
                  data-testid="edit-user-lastName"
                  control={form.control}
                  translation={t}
                  name="lastName"
                  label={t('lastName')}
                />
                <Button
                  data-testid="cancel-update-profile"
                  onClick={onCancel}
                  aria-label={t('cancelUpdate')}
                  title={t('cancelUpdate')}
                >
                  <CloseIcon />
                </Button>
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  data-testid="update-profile"
                  aria-label={t('update')}
                  title={t('update')}
                >
                  {form.formState.isSubmitting ? <Spinner /> : <DoneIcon />}
                </Button>
              </div>
              {error && <p>{t(error)}</p>}
            </Form>
          ) : (
            <div className="align-center">
              <div className="mr1">
                {session.user.firstName} {session.user.lastName}
              </div>
              <Button data-testid="edit-profile" onClick={() => setEditing(true)}>
                <EditIcon />
              </Button>
            </div>
          )}
        </div>
        <div className="mb1">{session.user.email}</div>
        <div className="mb1">
          <Logout />
        </div>
        <div className="mb1">
          <Link data-testid="legal-notices-link" href="/mentions-legales">
            {t('legalNotices')}
          </Link>
        </div>
      </div>
      <div>
        <div className="flex-col justify-end">
          <LocaleSelector />
        </div>
      </div>
    </div>
  )
}

export default Profile
