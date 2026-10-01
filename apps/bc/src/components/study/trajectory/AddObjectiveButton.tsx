import AddIcon from '@mui/icons-material/Add'
import classNames from 'classnames'
import styles from './AddObjectiveButton.module.css'

interface Props {
  onClick: () => void
}

const AddObjectiveButton = ({ onClick }: Props) => {
  return (
    <div onClick={onClick} className={classNames('flex-cc pointer', styles.addObjectiveButton)}>
      <AddIcon fontSize="large" />
    </div>
  )
}

export default AddObjectiveButton
