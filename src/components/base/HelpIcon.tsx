import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import classNames from 'classnames'
import { MouseEventHandler } from 'react'
import styles from './HelpIcon.module.css'

interface Props {
  className?: string
  onClick: MouseEventHandler<SVGSVGElement>
  label: string
}

const HelpIcon = ({ className, onClick, label }: Props) => (
  <HelpOutlineIcon
    className={classNames(styles.helpIcon, className)}
    onClick={onClick}
    aria-label={label}
    titleAccess={label}
  />
)

export default HelpIcon
