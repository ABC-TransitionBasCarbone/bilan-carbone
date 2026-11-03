import Block from '@abc-transitionbascarbone/common/components/base/Block'
import type { CourseSession } from '@abc-transitionbascarbone/common/db'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import { getFormatter, getTranslations } from 'next-intl/server'
import styles from './CourseSessionHeader.module.css'

interface Props {
  session: Pick<CourseSession, 'name' | 'type' | 'startDate' | 'endDate'>
}

const CourseSessionHeader = async ({ session }: Props) => {
  const [t, format] = await Promise.all([getTranslations('courseSessions'), getFormatter()])

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
                <time dateTime={session.startDate.toISOString()}>
                  {format.dateTime(session.startDate, { dateStyle: 'long', timeZone: 'UTC' })}
                </time>
                {' – '}
                <time dateTime={session.endDate.toISOString()}>
                  {format.dateTime(session.endDate, { dateStyle: 'long', timeZone: 'UTC' })}
                </time>
              </span>
            </p>
          </div>
        </div>
      </div>
    </Block>
  )
}

export default CourseSessionHeader
