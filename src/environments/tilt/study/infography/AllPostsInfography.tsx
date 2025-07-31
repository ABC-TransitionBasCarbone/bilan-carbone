import styles from '@/components/study/infography/AllPostsInfography.module.css'
import PostInfography from '@/components/study/infography/PostInfography'
import { FullStudy } from '@/db/study'
import { TiltPost } from '@/services/posts'
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
      <div className={classNames(styles.borderFull, 'flex-col')}>
        <div className={classNames(styles.postTitle)}>{t('IntrantsBiensEtServices')}</div>
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === TiltPost.IntrantsBiensEtMatieresTilt)}
          post={TiltPost.IntrantsBiensEtMatieresTilt}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === TiltPost.Alimentation)}
          post={TiltPost.Alimentation}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === TiltPost.IntrantsServices)}
          post={TiltPost.IntrantsServices}
          resultsUnit={study.resultsUnit}
        />
        <PostInfography
          studyId={study.id}
          data={data.find((d) => d.post === TiltPost.EquipementsEtImmobilisations)}
          post={TiltPost.EquipementsEtImmobilisations}
          resultsUnit={study.resultsUnit}
        />
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <div className={classNames(styles.borderFull, 'flex-col')}>
          <div className={classNames(styles.postTitle)}>{t('Deplacements')}</div>
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.DeplacementsDePersonne)}
            post={TiltPost.DeplacementsDePersonne}
            resultsUnit={study.resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.TransportDeMarchandises)}
            post={TiltPost.TransportDeMarchandises}
            resultsUnit={study.resultsUnit}
          />
        </div>
        <div className={classNames(styles.borderFull, 'flex-col')}>
          <div className={classNames(styles.postTitle)}>{t('LocauxEtInfrastructures')}</div>
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.ConstructionDesLocaux)}
            post={TiltPost.ConstructionDesLocaux}
            resultsUnit={study.resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.Energies)}
            post={TiltPost.Energies}
            resultsUnit={study.resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.Déchets)}
            post={TiltPost.Déchets}
            resultsUnit={study.resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.FroidEtClim)}
            post={TiltPost.FroidEtClim}
            resultsUnit={study.resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.AutresEmissions)}
            post={TiltPost.AutresEmissions}
            resultsUnit={study.resultsUnit}
          />
        </div>
      </div>
      <div className={classNames(styles.column, 'flex-col')}>
        <div className={classNames(styles.borderFull, 'flex-col mb2')}>
          <div className={classNames(styles.postTitle)}>{t('UtilisationEtFinDeVie')}</div>
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.Utilisation)}
            post={TiltPost.Utilisation}
            resultsUnit={study.resultsUnit}
          />
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.FinDeVie)}
            post={TiltPost.FinDeVie}
            resultsUnit={study.resultsUnit}
          />
        </div>
        <div className={'flex-col mt2'}>
          <PostInfography
            studyId={study.id}
            data={data.find((d) => d.post === TiltPost.Teletravail)}
            post={TiltPost.Teletravail}
            resultsUnit={study.resultsUnit}
          />
        </div>
      </div>
    </div>
  )
}

export default AllPostsInfography
