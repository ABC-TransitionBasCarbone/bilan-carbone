import { Actuality } from '@prisma/client'
import classNames from 'classnames'
import dayjs from 'dayjs'
import styles from './styles.module.css'

const ActualityRow = (actuality: Actuality) => (
  <div className={classNames(styles.actuality, 'flex-col mb1')} key={actuality.id}>
    <div className={classNames(styles.header, 'flex mb-2')}>
      <span>{dayjs(new Date(actuality.updatedAt)).format('DD/MM/YYYY')}</span>
      <span>{actuality.title}</span>
    </div>
    <pre>{actuality.text}</pre>
  </div>
)

export default ActualityRow
