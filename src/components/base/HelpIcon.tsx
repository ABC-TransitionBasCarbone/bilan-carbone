import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import styles from './HelpIcon.module.css'

interface Props {
  onClick: () => void
  label: string
}

const Help = ({ onClick, label }: Props) => (
  <HelpOutlineIcon className={styles.helpIcon} onClick={onClick} aria-label={label} titleAccess={label} />
)

export default Help
