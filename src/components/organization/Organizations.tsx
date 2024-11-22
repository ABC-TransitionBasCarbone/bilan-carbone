'use server'

import React from 'react'
import styles from './Organizations.module.css'
import classNames from 'classnames'
import Link from '../base/Link'
import { Organization } from '@prisma/client'

interface Props {
  organizations: Organization[]
}

const Organizations = async ({ organizations }: Props) => {
  return (
    <ul className={classNames(styles.list, 'flex-col')}>
      {organizations.map((organization) => (
        <li key={organization.id}>
          <Link href={`/organisations/${organization.id}`} data-testid="organization" className={styles.link}>
            {organization.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default Organizations
