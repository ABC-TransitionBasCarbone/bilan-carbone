import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './StudiesContainer.module.css'
import Studies from './Studies'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import NewspaperIcon from '@mui/icons-material/Newspaper'
import { User } from 'next-auth'

interface Props {
  user: User
  orgnizationId?: string
}

const StudiesContainer = ({ user, orgnizationId }: Props) => {
  const t = useTranslations('study')
  return (
    <Box data-testid="home-studies" className="flex-col grow">
      <div data-testid="studies-title" className={classNames(styles.title, 'flex-cc pb1')}>
        <NewspaperIcon /> <h2>{t('myStudies')}</h2>
      </div>
      <div className={classNames(styles.button, 'w100 flex')}>
        <LinkButton data-testid="new-study" className="mb1" href="/etudes/creer">
          {t('create')}
        </LinkButton>
      </div>
      <Studies user={user} orgnizationId={orgnizationId} />
    </Box>
  )
}

export default StudiesContainer
