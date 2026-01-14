import { LocalGroceryStore, LocationOn } from '@mui/icons-material'
import { EmissionFactorBase } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './BaseChip.module.css'

interface Props {
  base: EmissionFactorBase
  withLabel?: boolean
}

const BaseChip = ({ base, withLabel }: Props) => {
  const t = useTranslations('emissionFactors.base')
  const Icon = base === EmissionFactorBase.LocationBased ? LocationOn : LocalGroceryStore

  return (
    <div className={classNames(styles.chip, styles[base], 'flex align-center px1 py-2')}>
      <Icon />
      {withLabel && <span className="ml-2">{t(base)}</span>}
    </div>
  )
}

export default BaseChip
