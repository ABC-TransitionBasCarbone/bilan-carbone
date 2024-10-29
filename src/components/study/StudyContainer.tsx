import classNames from 'classnames'
import { Role, Study } from '@prisma/client'
import { useTranslations } from 'next-intl'
import styles from './StudyContainer.module.css'
import Studies from './Studies'
import Box from '../base/Box'
import LinkButton from '../base/LinkButton'
import NewspaperIcon from '@mui/icons-material/Newspaper'

interface Props {
  role: Role
  studies: Study[]
}

const StudyContainer = ({ studies }: Props) => {
  const t = useTranslations('study')
  return (
    <Box data-testid="home-studies" className="flex-col grow">
      <div data-testid="studies-title" className={classNames(styles.title, 'flex-cc pb1')}>
        <NewspaperIcon /> <h2>{t('my-studies')}</h2>
      </div>

      <div className={classNames(styles.button, 'w100 flex')}>
        <LinkButton data-testid="new-study" className="mb1" href="/etudes/creer">
          {t('create')}
        </LinkButton>
      </div>
      <Studies studies={studies} />
    </Box>
  )
}

export default StudyContainer
