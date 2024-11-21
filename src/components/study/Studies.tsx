'use server'

import React from 'react'
import styles from './Studies.module.css'
import classNames from 'classnames'
import { User } from 'next-auth'
import { getStudiesByUserAndOrganization, getStudiesByUser } from '@/db/study'
import { filterAllowedStudies } from '@/services/permissions/study'
import Link from '../base/Link'

interface Props {
  user: User
  orgnizationId?: string
}

const Studies = async ({ user, orgnizationId }: Props) => {
  const getStudies = orgnizationId
    ? () => getStudiesByUserAndOrganization(user, orgnizationId)
    : () => getStudiesByUser(user)
  const studies = await getStudies()
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
