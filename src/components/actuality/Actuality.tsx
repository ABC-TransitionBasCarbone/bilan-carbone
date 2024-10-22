import classNames from 'classnames'
import { Actuality } from '@prisma/client'
import styles from './styles.module.css'
import dayjs from 'dayjs'

interface Props {
  actuality: Actuality
}

const ActualityRow = ({ actuality }: Props) => (
  <div data-testid="actuality" className="flex-col mb1">
    <p className={classNames(styles.header, 'flex mb-2')}>
      <span>{dayjs(new Date(actuality.updatedAt)).format('DD/MM/YYYY')}</span>
      <span>{actuality.title}</span>
    </p>
    <p className={styles.text}>{actuality.text}</p>
  </div>
)

export default ActualityRow
