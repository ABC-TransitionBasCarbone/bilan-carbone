import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import HomeIcon from '@mui/icons-material/Home'
import PersonIcon from '@mui/icons-material/Person'
import { Role } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { FormTextField } from '../form/TextField'
import styles from './Onboarding.module.css'

interface Props {
  form: UseFormReturn<OnboardingCommand>
  role: Role
}

const OnboardingStep = ({ form, role }: Props) => {
  const t = useTranslations('onboarding.step1')
  const tRole = useTranslations('role')
  return (
    <>
      <div className="mb1">
        <FormTextField
          className="w100"
          control={form.control}
          name="companyName"
          label={t('name')}
          icon={<HomeIcon />}
          fullWidth
        />
      </div>
      <div>
        <div className="align-center mb-2 bold">
          <PersonIcon />
          <span className="ml-2">{t('information')}</span>
        </div>
        <div className={classNames(styles.fields, 'flex mb-2')}>
          <div className="grow">
            <FormTextField control={form.control} name="firstName" label={t('firstName')} fullWidth />
          </div>
          <div className="grow">
            <FormTextField control={form.control} name="lastName" label={t('lastName')} fullWidth />
          </div>
        </div>
        <div className="mb-2 bold">
          <span>{t('role')}</span>
        </div>
        <div data-testid="user-role" className={styles.roleLabel}>
          {tRole(role)}
        </div>
        {role === Role.ADMIN ? (
          <p className="mt1">{t('adminDescription')}</p>
        ) : (
          <p className="mt1">{t('gestionnaireDescription')}</p>
        )}
      </div>
    </>
  )
}

export default OnboardingStep
