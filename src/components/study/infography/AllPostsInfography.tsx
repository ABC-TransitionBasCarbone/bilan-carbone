import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import styles from './AllPostsInfography.module.css'
import PostInfography from './PostInfography'

interface Props {
  study: FullStudy
  studySite: string
}

const AllPostsInfography = ({ study, studySite }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const [validatedOnly, setValidatedOnly] = useState(true)

  useEffect(() => {
    applyUserSettings()
  }, [])

  const applyUserSettings = async () => {
    const validatedOnlySetting = (await getUserSettings())?.validatedEmissionSourcesOnly
    if (validatedOnlySetting !== undefined) {
      setValidatedOnly(validatedOnlySetting)
    }
  }

  const data = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly),
    [study, tPost, studySite, validatedOnly],
  )
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
