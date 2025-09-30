import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { SvgIconProps } from '@mui/material'
import classNames from 'classnames'
import { MouseEventHandler } from 'react'
import styles from './HelpIcon.module.css'

interface Props extends SvgIconProps {
  className?: string
  onClick: MouseEventHandler<SVGSVGElement>
  label: string
}

const HelpIcon = ({ className, onClick, label, ...props }: Props) => (
  <HelpOutlineIcon
    className={classNames(styles.helpIcon, className)}
    onClick={onClick}
    aria-label={label}
    titleAccess={label}
    {...props}
  />
)

export default HelpIcon
