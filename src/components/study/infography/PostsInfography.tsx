import { Post } from '@/services/posts'
import { Study, SubPost } from '@prisma/client'
import classNames from 'classnames'
import PostInfography from './PostInfography'
import styles from './PostsInfography.module.css'

interface Props {
  study: Study
  hideSubPosts?: boolean
}

const PostsInfography = ({ study, hideSubPosts }: Props) => {
  return (
    <div className={classNames(styles.infography, 'flex', 'justify-between', 'align-center')}>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={Post.IntrantsBienEtMatieres} hideSubPosts={hideSubPosts} />
        <PostInfography study={study} post={Post.IntrantsServices} hideSubPosts={hideSubPosts} />
        <PostInfography study={study} post={Post.Immobilisations} hideSubPosts={hideSubPosts} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={SubPost.FretEntrant} hideSubPosts={hideSubPosts} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={Post.Deplacements} hideSubPosts={hideSubPosts} />
        <div className={classNames(styles.border, 'flex-col')}>
          <PostInfography study={study} post={Post.Energies} hideSubPosts={hideSubPosts} />
          <PostInfography study={study} post={Post.AutresEmissionsNonEnergetiques} hideSubPosts={hideSubPosts} />
          <PostInfography study={study} post={SubPost.FretInterne} hideSubPosts={hideSubPosts} />
        </div>
        <PostInfography study={study} post={Post.DechetsDirects} hideSubPosts={hideSubPosts} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={SubPost.FretSortant} hideSubPosts={hideSubPosts} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={Post.FinDeVie} hideSubPosts={hideSubPosts} />
        <PostInfography study={study} post={Post.UtilisationEtDependance} hideSubPosts={hideSubPosts} />
      </div>
    </div>
  )
}

export default PostsInfography
