import { OnboardingCommand } from '@/services/serverFunctions/user.command'
import HomeIcon from '@mui/icons-material/Home'
import PersonIcon from '@mui/icons-material/Person'
import { MenuItem } from '@mui/material'
import { Role } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { UseFormReturn } from 'react-hook-form'
import { FormSelect } from '../form/Select'
import { FormTextField } from '../form/TextField'
import styles from './Onboarding.module.css'

interface Props {
  form: UseFormReturn<OnboardingCommand>
}

const OnboardingStep = ({ form }: Props) => {
  const t = useTranslations('onboarding.step1')
  const tRole = useTranslations('role')
  return (
    <>
      <div className="mb1">
        <div className={classNames(styles.field, 'align-center mb-2')}>
          <HomeIcon />
          <span className="ml-2">{t('name')}</span>
        </div>
        <FormTextField control={form.control} name="companyName" translation={t} />
      </div>
      <div>
        <div className={classNames(styles.field, 'align-center mb-2')}>
          <PersonIcon />
          <span className="ml-2">{t('role')}</span>
        </div>
        <FormSelect
          data-testid="onboarding-user-role"
          className={styles.role}
          control={form.control}
          translation={t}
          name="role"
        >
          <MenuItem key={Role.ADMIN} value={Role.ADMIN}>
            {tRole(Role.ADMIN)}
          </MenuItem>
          <MenuItem key={Role.DEFAULT} value={Role.DEFAULT}>
            {tRole(Role.DEFAULT)}
          </MenuItem>
        </FormSelect>
        <p className="mt1">{t('roleDescription')}</p>
      </div>
    </>
  )
}

export default OnboardingStep
