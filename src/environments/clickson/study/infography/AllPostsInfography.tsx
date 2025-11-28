import styles from '@/components/study/infography/AllPostsInfography.module.css'
import PostInfography from '@/components/study/infography/PostInfography'
import { FullStudy } from '@/db/study'
import { ClicksonPost } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'

interface Props {
  study: FullStudy
  data: ResultsByPost[]
}

const AllPostsInfography = ({ study, data }: Props) => {
  const t = useTranslations('emissionFactors.post')

  return (
    <div className={classNames(styles.infography, 'flex', 'justify-between', 'align-center')}>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === ClicksonPost.Achats)}
          post={ClicksonPost.Achats}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === ClicksonPost.Immobilisations)}
          post={ClicksonPost.Immobilisations}
          resultsUnit={study.resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === ClicksonPost.Deplacements)}
          post={ClicksonPost.Deplacements}
          resultsUnit={study.resultsUnit}
        />
        <div className={classNames(styles.border, 'flex-col')}>
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === ClicksonPost.Energies)}
            post={ClicksonPost.Energies}
            resultsUnit={study.resultsUnit}
          />
        </div>
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === ClicksonPost.Restauration)}
          post={ClicksonPost.Restauration}
          resultsUnit={study.resultsUnit}
        />
      </div>
    </div>
  )
}

export default AllPostsInfography
