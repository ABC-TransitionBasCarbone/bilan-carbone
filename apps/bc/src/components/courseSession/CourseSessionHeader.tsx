import Block from '@abc-transitionbascarbone/common/components/base/Block'
import type { CourseSession } from '@abc-transitionbascarbone/common/db'
import { formatDateFr } from '@abc-transitionbascarbone/common/utils'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import { getTranslations } from 'next-intl/server'
import styles from './CourseSessionHeader.module.css'

interface Props {
  session: Pick<CourseSession, 'name' | 'type' | 'startDate' | 'endDate'>
}

const CourseSessionHeader = async ({ session }: Props) => {
  const t = await getTranslations('courseSessions')
  return (
    <Block className={styles.header}>
      <div className={styles.heading}>
        <div className={styles.details}>
          <h1 className={styles.name} data-testid="course-session-name">
            {session.name}
          </h1>
          <div className={styles.metadata}>
            <span className={styles.badge} data-testid="course-session-type">
              {t(`types.${session.type}`)}
            </span>
            <p className={styles.dates}>
              <CalendarMonthOutlinedIcon aria-hidden="true" />
              <span>
                <time dateTime={session.startDate.toISOString()}>{formatDateFr(session.startDate)}</time>
                {' – '}
                <time dateTime={session.endDate.toISOString()}>{formatDateFr(session.endDate)}</time>
              </span>
            </p>
          </div>
        </div>
      </div>
    </Block>
  )
}

export default CourseSessionHeader
