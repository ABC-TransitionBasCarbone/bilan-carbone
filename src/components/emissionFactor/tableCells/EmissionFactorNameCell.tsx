import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Getter } from '@tanstack/react-table'
import styles from '../EmissionFactorsTable.module.css'

interface Props {
  expanded: boolean
  getValue: Getter<string>
}
export const EmissionFactorNameCell = ({ expanded, getValue }: Props) => (
  <div className="align-center">
    {expanded ? <KeyboardArrowDownIcon className={styles.svg} /> : <KeyboardArrowRightIcon className={styles.svg} />}
    <span className={styles.name}>{getValue<string>()}</span>
  </div>
)
