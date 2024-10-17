import classNames from 'classnames'
import { Role, Study } from '@prisma/client'
import { useTranslations } from 'next-intl'
import styles from './Study.module.css'
import Studies from './Studies'
import LinkButton from '../base/LinkButton'
import NewspaperIcon from '@mui/icons-material/Newspaper'

interface Props {
  role: Role
  studies: Study[]
}

const StudyContainer = ({ studies }: Props) => {
  const t = useTranslations('study')
  return (
    <div className="flex-col box grow m-2">
      <h2 className={classNames(styles.title, 'align-center pb1')}>
        <NewspaperIcon /> {t('my-studies')}
      </h2>
      <LinkButton data-testid="new-study" className="mb1" href="/etudes/creer">
        {t('create')}
      </LinkButton>
      <Studies studies={studies} />
    </div>
  )
}

export default StudyContainer
