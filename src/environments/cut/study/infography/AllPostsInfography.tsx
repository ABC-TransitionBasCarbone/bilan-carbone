import PostInfography from '@/components/study/infography/PostInfography'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import classNames from 'classnames'
import styles from './AllPostsInfography.module.css'

interface Props {
  study: FullStudy
  data: ResultsByPost[]
}

const AllPostsInfography = ({ study, data }: Props) => {
  return (
    <div className={classNames('flex', 'justify-between', 'align-center')}>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.Fonctionnement)}
          post={Post.Fonctionnement}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.SallesEtCabines)}
          post={Post.SallesEtCabines}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.BilletterieEtCommunication)}
          post={Post.BilletterieEtCommunication}
          resultsUnit={study.resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.MobiliteSpectateurs)}
          post={Post.MobiliteSpectateurs}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.ConfiseriesEtBoissons)}
          post={Post.ConfiseriesEtBoissons}
          resultsUnit={study.resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.TourneesAvantPremiere)}
          post={Post.TourneesAvantPremiere}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.Dechets)}
          post={Post.Dechets}
          resultsUnit={study.resultsUnit}
        />
      </div>
    </div>
  )
}

export default AllPostsInfography
