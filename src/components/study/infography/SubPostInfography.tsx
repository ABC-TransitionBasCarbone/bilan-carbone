import GlossaryIconModal from '@/components/modals/GlossaryIconModal'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { Environment, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import styles from './SubPostInfography.module.css'

interface Props {
  subPosts: SubPost[] | null
  ref: React.RefObject<HTMLDivElement | null>
  environment: Environment
}

export const SubPostInfography = ({ subPosts, ref, environment }: Props) => {
  const t = useTranslations('emissionFactors.post')
  const tInfo = useTranslations('postInfographyInfo')

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
                {environment === Environment.TILT && tInfo.has(subPost) && (
                  <GlossaryIconModal
                    title="postInfo"
                    className="ml-2"
                    iconLabel="information"
                    label={subPost}
                    tModal="postInfographyInfo"
                  >
                    {tInfo.rich(subPost, {
                      link: (children) => (
                        <Link className={styles.link} href={tInfo(`${subPost}Link`)} target="_blank">
                          {children}
                        </Link>
                      ),
                    })}
                  </GlossaryIconModal>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
