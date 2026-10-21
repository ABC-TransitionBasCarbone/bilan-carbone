import classNames from 'classnames'
import styles from './Label.module.css'

interface Props {
  children: React.ReactNode
  className?: string
}

const Label = ({ children, className }: Props) => <div className={classNames(styles.label, className)}>{children}</div>

export default Label
