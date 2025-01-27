import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { MenuItem } from '@mui/material'
import { Role } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { UseFormReturn, useWatch } from 'react-hook-form'
import Button from '../base/Button'
import { FormSelect } from '../form/Select'
import { FormTextField } from '../form/TextField'
import styles from './Onboarding.module.css'

interface Props {
  form: UseFormReturn<OnboardingCommand>
}

const OnboardingStep = ({ form }: Props) => {
  const t = useTranslations('onboarding.step2')
  const tRole = useTranslations('role')
  const collaborators = useWatch(form).collaborators?.length || 0

  const addCollaborator = () => {
    form.setValue('collaborators', (form.getValues('collaborators') || [])?.concat([{ email: '' }]))
  }

  const removeCollaborator = (index: number) => {
    form.clearErrors(`collaborators.${index}`)
    const collaborators = form.getValues().collaborators || []
    collaborators.splice(index, 1)
    form.setValue('collaborators', collaborators)
  }

  return (
    <>
      {Array.from({ length: collaborators }).map((_, index) => (
        <div key={`collaborator-${index}`}>
          <span>{t('email')}</span>
          <div className={classNames(styles.collaborator, 'flex')}>
            <div className="grow">
              <FormTextField control={form.control} name={`collaborators.${index}.email`} translation={t} />
            </div>
            <div className="grow">
              <FormSelect
                data-testid="onboarding-user-role"
                className={styles.role}
                control={form.control}
                translation={t}
                name={`collaborators.${index}.role`}
                renderValue={tRole}
                MenuProps={{
                  anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                  transformOrigin: { vertical: 'top', horizontal: 'left' },
                }}
              >
                <MenuItem key={Role.ADMIN} value={Role.ADMIN} className={classNames(styles.roleItem, 'flex-col')}>
                  <span className={styles.roleTitle}>{tRole(Role.ADMIN)}</span>
                  <span>{t('adminDescription')}</span>
                </MenuItem>
                <MenuItem key={Role.DEFAULT} value={Role.DEFAULT} className={classNames(styles.roleItem, 'flex-col')}>
                  <span className={styles.roleTitle}>{tRole(Role.DEFAULT)}</span>
                  <span>{t('collaboratorDescription')}</span>
                </MenuItem>
              </FormSelect>
            </div>
            <div>
              <Button className={styles.deleteButton} onClick={() => removeCollaborator(index)}>
                <DeleteIcon />
              </Button>
            </div>
          </div>
        </div>
      ))}
      <div className="mt1">
        <Button color="secondary" onClick={addCollaborator}>
          <AddIcon />
          {t('addCollaborator')}
        </Button>
      </div>
    </>
  )
}

export default OnboardingStep
