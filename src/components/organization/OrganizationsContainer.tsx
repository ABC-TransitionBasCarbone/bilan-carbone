import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './OrganizationsContainer.module.css'
import Organizations from './Organizations'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import { Organization } from '@prisma/client'

interface Props {
  organizations: Organization[]
}

const OrganizationsContainer = ({ organizations }: Props) => {
  const t = useTranslations('organization')
  return (
    <Box data-testid="home-organizations" className="flex-col grow">
      <div data-testid="organizations-title" className={classNames(styles.title, 'flex-cc pb1')}>
        <NewspaperIcon /> <h2>{t('my-organizations')}</h2>
      </div>
      <div className={classNames(styles.button, 'w100 flex')}>
        <LinkButton data-testid="new-study" className="mb1" href="/organisations/creer">
          {t('create')}
        </LinkButton>
      </div>
      <Organizations organizations={organizations} />
    </Box>
  )
}

export default OrganizationsContainer
