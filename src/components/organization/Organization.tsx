import CorporateFareIcon from '@mui/icons-material/CorporateFare'
import { Organization } from '@prisma/client'
import classNames from 'classnames'
import Link from 'next/link'
import Box from '../base/Box'
import styles from './Organization.module.css'

interface Props {
  organization: Organization
}

const OrganizationCard = ({ organization }: Props) => (
  <li data-testid="organization" className="flex">
    <Box className={classNames(styles.card, 'flex grow')}>
      <Link
        href={`/organisations/${organization.id}`}
        className={classNames(styles.link, 'flex-col align-center grow')}
      >
        <CorporateFareIcon />
        <p className="grow align-center text-center bold">{organization.name}</p>
      </Link>
    </Box>
  </li>
)

export default OrganizationCard
