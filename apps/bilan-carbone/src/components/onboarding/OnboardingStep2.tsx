import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import { getEnvironmentRoles } from '@/utils/user'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { MenuItem } from '@mui/material'
import { FormTextField } from '@repo/components/src/form/TextField'
import { Environment, Role } from '@repo/db-common/enums'
import { Button } from '@repo/ui'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { UseFormReturn, useWatch } from 'react-hook-form'
import { FormSelect } from '../form/Select'
import styles from './Onboarding.module.css'

interface Props {
  form: UseFormReturn<OnboardingCommand>
  isCr: boolean
  environment: Environment
}

const OnboardingStep = ({ form, isCr, environment }: Props) => {
  const t = useTranslations('onboarding.step2')
  const tRole = useTranslations('role')
  const collaborators = useWatch(form).collaborators?.length || 0

  const addCollaborator = () => {
    form.setValue('collaborators', (form.getValues('collaborators') || [])?.concat([{ email: '', role: undefined }]))
  }

  const removeCollaborator = (index: number) => {
    form.clearErrors(`collaborators.${index}`)
    const collaborators = form.getValues().collaborators || []
    collaborators.splice(index, 1)
    form.setValue('collaborators', collaborators)
  }

  const getDescription = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return 'adminDescription'
      case Role.GESTIONNAIRE:
        return 'gestionnaireDescription'
      case Role.DEFAULT:
        return 'memberDescription'
      default:
        return isCr ? 'crCollaboratorDescription' : 'collaboratorDescription'
    }
  }

  return (
    <>
      {Array.from({ length: collaborators }).map((_, index) => (
        <div key={`collaborator-${index}`} className={classNames(styles.collaborator, 'flex')}>
          <div className="grow">
            <FormTextField
              control={form.control}
              name={`collaborators.${index}.email`}
              fullWidth
              {...(index === 0 && { label: t('email') })}
              placeholder={t('emailPlaceholder')}
            />
          </div>
          <div className="grow">
            <FormSelect
              data-testid="onboarding-user-role"
              className={styles.role}
              control={form.control}
              translation={t}
              name={`collaborators.${index}.role`}
              MenuProps={{
                anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
                transformOrigin: { vertical: 'top', horizontal: 'left' },
              }}
              renderValue={(role) => tRole(role as string)}
              fullWidth
            >
              {Object.keys(getEnvironmentRoles(environment))
                .filter((role) => role !== Role.SUPER_ADMIN)
                .map((role) => (
                  <MenuItem key={role} value={role} className={classNames(styles.roleItem, 'flex-col')}>
                    <span className={styles.roleTitle}>{tRole(role)}</span>
                    <span>{t(getDescription(role as Role))}</span>
                  </MenuItem>
                ))}
            </FormSelect>
          </div>
          <Button className={styles.deleteButton} onClick={() => removeCollaborator(index)}>
            <DeleteIcon />
          </Button>
        </div>
      ))}
      <Button onClick={addCollaborator}>
        <AddIcon />
        {t('addCollaborator')}
      </Button>
    </>
  )
}

export default OnboardingStep
