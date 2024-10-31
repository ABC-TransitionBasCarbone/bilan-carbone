'use server'

import Link from 'next/link'
import React from 'react'
import styles from './Studies.module.css'
import classNames from 'classnames'
import { User } from 'next-auth'
import { getStudyByUser } from '@/db/study'
import { filterAllowedStudies } from '@/services/permissions/study'

interface Props {
  user: User
}

const Studies = async ({ user }: Props) => {
  const studies = await getStudyByUser(user)
  const allowedStudies = await filterAllowedStudies(user, studies)

  return (
    <ul className={classNames(styles.list, 'flex-col')}>
      {allowedStudies.map((study) => (
        <li key={study.id}>
          <Link href={`/etudes/${study.id}`} data-testid={`studies-${study.name}`} className={styles.link}>
            {study.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default Studies
