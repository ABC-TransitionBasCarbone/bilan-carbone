import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'
import styles from './AllPostsInfography.module.css'
import PostInfography from './PostInfography'

interface Props {
  study: FullStudy
  site: string
}

const AllPostsInfography = ({ study, site }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const data = useMemo(() => computeResultsByPost(study, tPost, site), [study, tPost])

  const findSubPost = (subPost: SubPost) => {
    const post = data.find((post) => post.subPosts.find((sb) => sb.post === subPost))
    const foundSubPost = post?.subPosts.find((sb) => sb.post === subPost)
    return foundSubPost
  }

  return (
    <div className={classNames(styles.infography, 'flex', 'justify-between', 'align-center')}>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.IntrantsBienEtMatieres)}
          post={Post.IntrantsBienEtMatieres}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.IntrantsServices)}
          post={Post.IntrantsServices}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.Immobilisations)}
          post={Post.Immobilisations}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography studyId={study.id} data={findSubPost(SubPost.FretEntrant)} post={SubPost.FretEntrant} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.Deplacements)}
          post={Post.Deplacements}
        />
        <div className={classNames(styles.border, 'flex-col')}>
          <PostInfography studyId={study.id} data={data.find((d) => d.post === Post.Energies)} post={Post.Energies} />
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === Post.AutresEmissionsNonEnergetiques)}
            post={Post.AutresEmissionsNonEnergetiques}
          />
          <PostInfography studyId={study.id} data={findSubPost(SubPost.FretInterne)} post={SubPost.FretInterne} />
        </div>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.DechetsDirects)}
          post={Post.DechetsDirects}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography studyId={study.id} data={findSubPost(SubPost.FretSortant)} post={SubPost.FretSortant} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography studyId={study.id} data={data.find((d) => d.post === Post.FinDeVie)} post={Post.FinDeVie} />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.UtilisationEtDependance)}
          post={Post.UtilisationEtDependance}
        />
      </div>
    </div>
  )
}

export default AllPostsInfography
