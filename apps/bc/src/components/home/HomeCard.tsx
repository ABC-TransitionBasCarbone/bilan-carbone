import { HomeCardItem } from '@/types/homeCards'
import Box from '@abc-transitionbascarbone/common/components/base/Box'
import CorporateFareIcon from '@mui/icons-material/CorporateFare'
import SchoolIcon from '@mui/icons-material/School'
import classNames from 'classnames'
import { useFormatter } from 'next-intl'
import Link from 'next/link'
import styles from './HomeCard.module.css'

interface Props {
  item: HomeCardItem
}

const HomeCard = ({ item }: Props) => {
  const format = useFormatter()
  const isClient = item.type === 'client'
  const content = (
    <>
      {isClient ? <CorporateFareIcon /> : <SchoolIcon />}
      <p className="grow align-center text-center bold">{item.name}</p>
      {!isClient && item.startDate && item.endDate && (
        <p className="text-center">
          <time dateTime={item.startDate.toISOString()}>{format.dateTime(item.startDate, { dateStyle: 'short' })}</time>
          {' - '}
          <time dateTime={item.endDate.toISOString()}>{format.dateTime(item.endDate, { dateStyle: 'short' })}</time>
        </p>
      )}
    </>
  )

  return (
    <li data-testid={isClient ? 'organization' : 'course-session'} className="flex">
      <Box className={classNames(styles.card, 'flex grow')}>
        {item.href ? (
          <Link href={item.href} className={classNames(styles.content, 'flex-col align-center grow')}>
            {content}
          </Link>
        ) : (
          <div className={classNames(styles.content, 'flex-col align-center grow')}>{content}</div>
        )}
      </Box>
    </li>
  )
}

export default HomeCard
