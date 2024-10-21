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
      <h2 data-testid="studies-title" className={classNames(styles.title, 'align-center pb1')}>
        <NewspaperIcon /> {t('my-studies')}
      </h2>
      <LinkButton data-testid="new-study" className="mb1" href="/etudes/creer">
        {t('create')}
      </LinkButton>
      <Studies studies={studies} />
    </Box>
  )
}

export default StudyContainer
