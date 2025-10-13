import CheckIcon from '@mui/icons-material/Check'
import { Typography } from '@mui/material'
import { TrajectoryType } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './TrajectoryCreationModal.module.css'

interface Props {
  type: TrajectoryType
  titleKey: string
  subtitleKey: string
  benefits: string[]
  isSelected: boolean
  disabled?: boolean
  handleModeSelect: (type: TrajectoryType) => void
}

const TrajectoryOption = ({
  type,
  titleKey,
  subtitleKey,
  benefits,
  isSelected,
  disabled = false,
  handleModeSelect,
}: Props) => {
  const t = useTranslations('study.transitionPlan.trajectoryModal')
  return (
    <div
      className={classNames(styles.trajectoryOption, 'p1 pointer', {
        [styles.selected]: isSelected,
        [styles.disabled]: disabled,
      })}
      onClick={disabled ? undefined : () => handleModeSelect(type)}
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <div className="flex align-start">
        <input type="radio" checked={isSelected} disabled={disabled} aria-label={t(titleKey)} readOnly />
        <div className="flex-col gapped-2 grow">
          <Typography fontWeight={'bold'} color="textSecondary">
            {t(titleKey)}
          </Typography>
          <Typography fontWeight={'bold'}>{t(subtitleKey)}</Typography>
          <div className="flex-col gapped025">
            {benefits.map((benefitKey, index) => (
              <div key={index} className="flex align-center">
                <CheckIcon className={styles.checkmark} />
                <Typography variant="body1">
                  {t.rich(benefitKey, { strong: (children) => <strong>{children}</strong> })}
                </Typography>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrajectoryOption
