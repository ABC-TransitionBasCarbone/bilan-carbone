import classNames from 'classnames'
import styles from './Box.module.css'

interface Props {
  children: React.ReactNode
  className?: string
}

const Box = ({ children, className, ...rest }: Props) => {
  return (
    <div className={classNames(styles.box, className)} {...rest}>
      {children}
    </div>
  )
}

export default Box
