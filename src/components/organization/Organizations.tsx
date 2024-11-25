'use server'

import { Organization } from '@prisma/client'
import classNames from 'classnames'
import Link from '../base/Link'
import styles from './Organizations.module.css'

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
