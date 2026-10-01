import classNames from 'classnames'
import styles from './ProgressBar.module.css'

interface Props {
  value: number
  barClass: string
}

const ProgressBar = ({ value, barClass }: Props) => (
  <div className={classNames(styles.wrapper, 'w100')}>
    <div className={classNames(styles.bar, barClass, styles[`w${value}`], 'h100')} />
  </div>
)

export default ProgressBar
