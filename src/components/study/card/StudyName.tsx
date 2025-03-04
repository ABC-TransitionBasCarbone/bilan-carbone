import Label from '@/components/base/Label'
import Leaf from '@mui/icons-material/Spa'
import classNames from 'classnames'
import styles from './StudyName.module.css'

interface Props {
  name: string
}

const StudyName = ({ name }: Props) => (
  <Label className={classNames(styles.name, 'align-center')}>
    <Leaf />
    <span className="ml-2">{name}</span>
  </Label>
)

export default StudyName
