import PostInfography from '@/components/study/infography/PostInfography'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import classNames from 'classnames'

interface Props {
  study: FullStudy
  data: ResultsByPost[]
}

const AllPostsInfography = ({ study, data }: Props) => {
  return (
    <div className={classNames('flex', 'justify-between', 'align-center')}>
      <PostInfography
        studyId={study.id}
        data={data.find((d) => d.post === Post.ConfiseriesEtBoissons)}
        post={Post.ConfiseriesEtBoissons}
        resultsUnit={study.resultsUnit}
      />
    </div>
  )
}

export default AllPostsInfography
