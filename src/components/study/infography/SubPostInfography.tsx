import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './SubPostInfography.module.css'

interface Props {
  subPosts: SubPost[] | null
  ref: React.RefObject<HTMLDivElement | null>
}

export const SubPostInfography = ({ subPosts, ref }: Props) => {
  const t = useTranslations('emissionFactors.post')

  if (!subPosts || subPosts.length === 0) {
    return null
  }

  return (
    <div className={styles.subPostsContainer} ref={ref}>
      {subPosts && (
        <div className={classNames(styles.subPosts, 'flex')}>
          <ul className={classNames(styles.list, 'flex-col')}>
            {subPosts.map((subPost) => (
              <li className="align-center" key={subPost}>
                <KeyboardArrowRightIcon />
                {t(subPost)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
