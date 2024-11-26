'use server'

import { getStudiesByUser, getStudiesByUserAndOrganization } from '@/db/study'
import { filterAllowedStudies } from '@/services/permissions/study'
import classNames from 'classnames'
import { User } from 'next-auth'
import Link from '../base/Link'
import styles from './Studies.module.css'

interface Props {
  user: User
  organizationId?: string
}

const Studies = async ({ user, organizationId }: Props) => {
  const studies = organizationId
    ? await getStudiesByUserAndOrganization(user, organizationId)
    : await getStudiesByUser(user)
  const allowedStudies = await filterAllowedStudies(user, studies)

  return (
    <ul className={classNames(styles.list, 'flex-col')}>
      {allowedStudies.map((study) => (
        <li key={study.id}>
          <Link href={`/etudes/${study.id}`} data-testid="study" className={styles.link}>
            {study.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default Studies
