import Leaf from '@mui/icons-material/Spa'
import classNames from 'classnames'
import styles from './StudyName.module.css'

interface Props {
  name: string
}

const StudyName = ({ name }: Props) => (
  <div className={classNames(styles.name, 'align-center')}>
    <Leaf />
    <span className="ml-2">{name}</span>
  </div>
)

export default StudyName
