import classNames from 'classnames'
import { Actuality } from '@prisma/client'
import styles from './styles.module.css'
import { useFormatter } from 'next-intl'

interface Props {
  actuality: Actuality
}

const ActualityRow = ({ actuality }: Props) => {
  const format = useFormatter()

  return (
    <li data-testid="actuality" className="flex-col">
      <h3 className={classNames(styles.header, 'title-h5 flex')}>{actuality.title}</h3>
      <p className={classNames(styles.date, 'mb-2')}>
        {format.dateTime(actuality.updatedAt, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </p>
      <p className={styles.text}>{actuality.text}</p>
    </li>
  )
}

export default ActualityRow
