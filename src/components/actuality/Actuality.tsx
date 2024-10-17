import classNames from 'classnames'
import { Actuality } from '@prisma/client'
import styles from './styles.module.css'
import dayjs from 'dayjs'

interface Props {
  actuality: Actuality
  // key: string
}

const ActualityRow = ({ actuality }: Props) => (
  <div data-testid="actuality" className="flex-col mb1">
    <p className={classNames(styles.header, 'flex mb-2')}>
      <span>{dayjs(new Date(actuality.updatedAt)).format('DD/MM/YYYY')}</span>
      <span>{actuality.title}</span>
    </p>
    <span className={styles.text}>{actuality.text}</span>
  </div>
)

export default ActualityRow
