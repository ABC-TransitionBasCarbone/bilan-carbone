import AddIcon from '@mui/icons-material/Add'
import { Organization } from '@prisma/client'
import classNames from 'classnames'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import Organizations from '../organization/Organizations'
import styles from './CRClientsList.module.css'

interface Props {
  organizations: Organization[]
}
const CRClientsList = async ({ organizations }: Props) => {
  const t = await getTranslations('organization')
  return organizations.length ? (
    <Organizations organizations={organizations} />
  ) : (
    <div className="justify-center">
      <Box className={classNames(styles.firstClientCard, 'flex-col align-center')}>
        <Image src="/img/CR.png" alt="cr.png" width={177} height={119} />
        <h5>{t('createFirstClient')}</h5>
        <p>{t('firstClientMessage')}</p>
        <LinkButton data-testid="new-organization" className="mb1" href="/organisations/creer">
          <AddIcon />
          {t('createFirstClient')}
        </LinkButton>
      </Box>
    </div>
  )
}

export default CRClientsList
