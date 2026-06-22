import { OrganizationVersionWithOrganization } from '@/db/organization'
import Box from '@abc-transitionbascarbone/components/src/base/Box'
import CorporateFareIcon from '@mui/icons-material/CorporateFare'
import classNames from 'classnames'
import Link from 'next/link'
import styles from './CRClient.module.css'

interface Props {
  organizationVersion: OrganizationVersionWithOrganization
}

const CRClient = ({ organizationVersion }: Props) => (
  <li data-testid="organization" className="flex">
    <Box className={classNames(styles.card, 'flex grow')}>
      <Link
        href={`/organisations/${organizationVersion.id}`}
        className={classNames(styles.link, 'flex-col align-center grow')}
      >
        <CorporateFareIcon />
        <p className="grow align-center text-center bold">{organizationVersion.organization.name}</p>
      </Link>
    </Box>
  </li>
)

export default CRClient
