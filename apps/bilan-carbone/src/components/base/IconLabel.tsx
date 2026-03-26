import classNames from 'classnames'
import styles from './IconLabel.module.css'

interface Props {
  icon: React.ReactNode
  iconPosition?: 'after' | 'before'
  className: string
  children: React.ReactNode
}

const IconLabel = ({ icon, iconPosition = 'before', className, children }: Props) => (
  <div className={classNames(styles.gapped, className, 'align-center')}>
    {iconPosition === 'before' && icon}
    {children}
    {iconPosition === 'after' && icon}
  </div>
)

export default IconLabel
