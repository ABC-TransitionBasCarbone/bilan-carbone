import classNames from 'classnames'
import { Actuality } from '@prisma/client'
import styles from './styles.module.css'
import dayjs from 'dayjs'

const ActualityRow = (actuality: Actuality) => (
  <div className={classNames(styles.actuality, 'flex-col mb1')} key={actuality.id}>
    <div className={classNames(styles.header, 'flex mb-2')}>
      <span>{dayjs(new Date(actuality.updatedAt)).format('DD/MM/YYYY')}</span>
      <span>{actuality.title}</span>
    </div>
    <span className={styles.text}>{actuality.text}</span>
  </div>
)

export default ActualityRow
