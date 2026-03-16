import { OrganizationVersionWithOrganization } from '@/db/organization'
import { canCreateOrganization } from '@/services/permissions/organization'
import AddIcon from '@mui/icons-material/Add'
import classNames from 'classnames'
import { UserSession } from 'next-auth'
import { getTranslations } from 'next-intl/server'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import Image from '../document/Image'
import CRClients from '../organization/CRClients'
import styles from './CRClientsList.module.css'

interface Props {
  organizationVersions: OrganizationVersionWithOrganization[]
  account: UserSession
}
const CRClientsList = async ({ organizationVersions, account }: Props) => {
  const t = await getTranslations('organization')
  const canCreateOrga = await canCreateOrganization(account)

  return organizationVersions.length ? (
    <CRClients organizationVersions={organizationVersions} canCreateOrga={canCreateOrga} />
  ) : (
    <div className="justify-center text-center">
      <Box className={classNames(styles.firstClientCard, 'flex-col align-center')}>
        <Image src="/img/CR.png" alt="cr.png" width={177} height={119} />
        <h5>{t('createFirstClient')}</h5>
        <p>{t('firstClientMessage')}</p>
        <LinkButton
          data-testid="new-organization"
          className={classNames(styles.linkButton, 'w100 justify-center mb1')}
          href="/organisations/creer"
        >
          <AddIcon />
          {t('createFirstClient')}
        </LinkButton>
      </Box>
    </div>
  )
}

export default CRClientsList
