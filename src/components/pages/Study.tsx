import classNames from 'classnames'
import { Study } from '@prisma/client'
import { useTranslations } from 'next-intl'
import styles from './Study.module.css'
import Studies from '../study/Studies'
import LinkButton from '../base/LinkButton'
import NewspaperIcon from '@mui/icons-material/Newspaper'

interface Props {
  studies: Study[]
}

const StudyPage = ({ studies }: Props) => {
  const t = useTranslations('study')
  return (
    <div className={classNames(styles.box, 'flex-col grow m-2 p1')}>
      <h2 className={classNames(styles.title, 'align-center pb1')}>
        <NewspaperIcon /> {t('my-studies')}
      </h2>
      <LinkButton className="mb1" href="/etudes/creer">
        {t('create')}
      </LinkButton>
      <Studies studies={studies} />
    </div>
  )
}

export default StudyPage
