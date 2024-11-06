import { Study, SubPost } from '@prisma/client'
import React from 'react'
import PostInfography from './PostInfography'
import { Post } from '@/services/posts'
import styles from './PostsInfography.module.css'
import classNames from 'classnames'

interface Props {
  study: Study
}

const PostsInfography = ({ study }: Props) => {
  return (
    <div className={classNames(styles.infography, 'flex', 'justify-between', 'align-center')}>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={Post.IntrantsBienEtMatieres} />
        <PostInfography study={study} post={Post.IntrantsServices} />
        <PostInfography study={study} post={Post.Immobilisations} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={SubPost.FretEntrant} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={Post.Deplacements} />
        <div className={classNames(styles.border, 'flex-col')}>
          <PostInfography study={study} post={Post.Energies} />
          <PostInfography study={study} post={Post.AutresEmissionsNonEnergetiques} />
          <PostInfography study={study} post={SubPost.FretInterne} />
        </div>
        <PostInfography study={study} post={Post.DechetsDirects} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={SubPost.FretSortant} />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography study={study} post={Post.FinDeVie} />
        <PostInfography study={study} post={Post.UtilisationEtDependance} />
      </div>
    </div>
  )
}

export default PostsInfography
