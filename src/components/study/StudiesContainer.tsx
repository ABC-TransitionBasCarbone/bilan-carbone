import NewspaperIcon from '@mui/icons-material/Newspaper'
import classNames from 'classnames'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import Studies from './Studies'
import styles from './StudiesContainer.module.css'

interface Props {
  user: User
  organizationId?: string
}

const StudiesContainer = ({ user, organizationId }: Props) => {
  const t = useTranslations('study')
  return (
    <Box data-testid="home-studies" className="flex-col grow">
      <div data-testid="studies-title" className={classNames(styles.title, 'flex-cc pb1')}>
        <NewspaperIcon /> <h2>{t('myStudies')}</h2>
      </div>
      <div className={classNames(styles.button, 'w100 flex')}>
        <LinkButton
          data-testid="new-study"
          className="mb1"
          href={`${organizationId ? `/organisations/${organizationId}` : ''}/etudes/creer`}
        >
          {t('create')}
        </LinkButton>
      </div>
      <Studies user={user} organizationId={organizationId} />
    </Box>
  )
}

export default StudiesContainer
