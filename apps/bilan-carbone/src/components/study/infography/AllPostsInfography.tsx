import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import styles from './AllPostsInfography.module.css'
import PostInfography from './PostInfography'

interface Props {
  study: FullStudy
  data: ResultsByPost[]
}

const AllPostsInfography = ({ study, data }: Props) => {
  const findSubPost = (subPost: SubPost) => {
    const post = data.find((post) => post.children.find((sb) => sb.post === subPost))
    const foundSubPost = post?.children.find((sb) => sb.post === subPost)
    return foundSubPost
  }

  return (
    <div className={classNames(styles.infography, 'flex', 'justify-between', 'align-center')}>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.IntrantsBiensEtMatieres)}
          post={Post.IntrantsBiensEtMatieres}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.IntrantsServices)}
          post={Post.IntrantsServices}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.Immobilisations)}
          post={Post.Immobilisations}
          resultsUnit={study.resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={findSubPost(SubPost.FretEntrant)}
          post={SubPost.FretEntrant}
          resultsUnit={study.resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.Deplacements)}
          post={Post.Deplacements}
          resultsUnit={study.resultsUnit}
        />
        <div className={classNames(styles.border, 'flex-col')}>
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === Post.Energies)}
            post={Post.Energies}
            resultsUnit={study.resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === Post.AutresEmissionsNonEnergetiques)}
            post={Post.AutresEmissionsNonEnergetiques}
            resultsUnit={study.resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={findSubPost(SubPost.FretInterne)}
            post={SubPost.FretInterne}
            resultsUnit={study.resultsUnit}
          />
        </div>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.DechetsDirects)}
          post={Post.DechetsDirects}
          resultsUnit={study.resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={findSubPost(SubPost.FretSortant)}
          post={SubPost.FretSortant}
          resultsUnit={study.resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.FinDeVie)}
          post={Post.FinDeVie}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.UtilisationEtDependance)}
          post={Post.UtilisationEtDependance}
          resultsUnit={study.resultsUnit}
        />
      </div>
    </div>
  )
}

export default AllPostsInfography
