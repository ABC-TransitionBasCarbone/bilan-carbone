import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { getUserSettings } from '@/services/serverFunctions/user'
import { defaultStudyResultUnit } from '@/utils/number'
import { StudyResultUnit, SubPost } from '@prisma/client'
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
  const [resultsUnit, setResultsUnit] = useState<StudyResultUnit>(defaultStudyResultUnit)

  useEffect(() => {
    applyUserSettings()
  }, [])

  const applyUserSettings = async () => {
    const userSettings = await getUserSettings()
    if (userSettings?.validatedEmissionSourcesOnly !== undefined) {
      setValidatedOnly(userSettings.validatedEmissionSourcesOnly)
    }
    if (userSettings?.studyUnit) {
      setResultsUnit(userSettings.studyUnit)
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
          unit={resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.IntrantsServices)}
          post={Post.IntrantsServices}
          unit={resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.Immobilisations)}
          post={Post.Immobilisations}
          unit={resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={findSubPost(SubPost.FretEntrant)}
          post={SubPost.FretEntrant}
          unit={resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.Deplacements)}
          post={Post.Deplacements}
          unit={resultsUnit}
        />
        <div className={classNames(styles.border, 'flex-col')}>
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === Post.Energies)}
            post={Post.Energies}
            unit={resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === Post.AutresEmissionsNonEnergetiques)}
            post={Post.AutresEmissionsNonEnergetiques}
            unit={resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={findSubPost(SubPost.FretInterne)}
            post={SubPost.FretInterne}
            unit={resultsUnit}
          />
        </div>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.DechetsDirects)}
          post={Post.DechetsDirects}
          unit={resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={findSubPost(SubPost.FretSortant)}
          post={SubPost.FretSortant}
          unit={resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.FinDeVie)}
          post={Post.FinDeVie}
          unit={resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === Post.UtilisationEtDependance)}
          post={Post.UtilisationEtDependance}
          unit={resultsUnit}
        />
      </div>
    </div>
  )
}

export default AllPostsInfography
