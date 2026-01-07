import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { Post } from '@/services/posts'
import { ResultsByPost } from '@/services/results/consolidated'
import { getDefaultRule, PostInfos } from '@/services/results/exports'
import { formatNumber } from '@/utils/number'
import { getPost } from '@/utils/post'
import { hasDeprecationPeriod, STUDY_UNIT_VALUES } from '@/utils/study'
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined'
import { Export, ExportRule, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import ConsolatedExportDifference, {
  calculEmissionSourcesDifference,
  EmissionSourceList,
} from './ConsolatedExportDifference'
import styles from './ConsolatedExportDifference.module.css'

interface Props {
  study: FullStudy
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
  results: ResultsByPost[]
  ghgpResults: PostInfos[]
  studySite: string
  ghgpRules: ExportRule[]
}

const ConsolatedGHGPDifference = ({
  study,
  emissionFactorsWithParts,
  validatedOnly,
  results,
  ghgpResults,
  studySite,
  ghgpRules,
}: Props) => {
  const t = useTranslations('study.results.difference')
  const tUnits = useTranslations('study.results.units')
  const unit = tUnits(study.resultsUnit)
  const unitValue = STUDY_UNIT_VALUES[study.resultsUnit]
  const router = useRouter()

  const environment = useMemo(() => study.organizationVersion.environment, [study])

  const navigateToEmissionSource = (emissionSourceId: string, subPost: SubPost) => {
    const post = getPost(subPost)
    if (post) {
      const emissionSource = study.emissionSources.find((es) => es.id === emissionSourceId)
      const targetSite = emissionSource?.studySite.id
      const url = `/etudes/${study.id}/comptabilisation/saisie-des-donnees/${post}?site=${targetSite}#emission-source-${emissionSourceId}`
      router.push(url)
    }
  }

  const emissionSourcesForSelectedSite = useMemo(() => {
    if (studySite === 'all') {
      return study.emissionSources
    }
    return study.emissionSources.filter((es) => es.studySite.id === studySite)
  }, [study.emissionSources, studySite])

  const utilisationEnDependanceInfos = results
    .find((result) => result.post === Post.UtilisationEtDependance)
    ?.children.find((subPost) => subPost.post === SubPost.UtilisationEnDependance)
  const hasUtilisationEnDependance = !!utilisationEnDependanceInfos && utilisationEnDependanceInfos.value !== 0
  // GHGP doesn't include "Utilisation en dépendance", BC does, so GHGP - BC = negative
  const utilisationEnDependanceValue = utilisationEnDependanceInfos
    ? -utilisationEnDependanceInfos.value / unitValue
    : 0
  const utilisationEnDependanceValueToDisplay = formatNumber(Math.round(utilisationEnDependanceValue), 0)

  // Find an emission source for the "en dépendance" sub-post to use in navigation
  const utilisationEnDependanceEmissionSources = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter(
        (emissionSource) => emissionSource.subPost === SubPost.UtilisationEnDependance,
      ),
    [emissionSourcesForSelectedSite],
  )

  const missingCaract = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (
          (!emissionSource.validated && validatedOnly) ||
          emissionSource.subPost === SubPost.UtilisationEnDependance
        ) {
          return false
        }

        if (!emissionSource.caracterisation) {
          return true
        }

        return false
      }),
    [emissionSourcesForSelectedSite, validatedOnly],
  )

  const missingCaractDifference = useMemo(
    () => calculEmissionSourcesDifference(missingCaract, emissionFactorsWithParts, environment, unitValue),
    [missingCaract, emissionFactorsWithParts, unitValue, environment],
  )

  const immobilisation = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (
          (!emissionSource.validated && validatedOnly) ||
          emissionSource.subPost === SubPost.UtilisationEnDependance
        ) {
          return false
        }

        return (
          hasDeprecationPeriod(emissionSource.subPost) &&
          (!emissionSource.constructionYear ||
            emissionSource.constructionYear?.getFullYear() !== study.startDate.getFullYear())
        )
      }),
    [emissionSourcesForSelectedSite, study.startDate, validatedOnly],
  )

  const immobilisationDifference = useMemo(
    () => calculEmissionSourcesDifference(immobilisation, emissionFactorsWithParts, environment, unitValue),
    [immobilisation, emissionFactorsWithParts, unitValue, environment],
  )

  const otherEmissions = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (
          (!emissionSource.validated && validatedOnly) ||
          emissionSource.subPost === SubPost.UtilisationEnDependance
        ) {
          return false
        }

        const subPostRules = ghgpRules.filter((rule) => rule.subPost === emissionSource.subPost)
        if (subPostRules.length === 0) {
          return false
        }
        const rule = getDefaultRule(subPostRules, emissionSource.caracterisation)
        return rule && rule.includes('other')
      }),
    [emissionSourcesForSelectedSite, ghgpRules, validatedOnly],
  )

  const otherEmissionsDifference = useMemo(
    () => calculEmissionSourcesDifference(otherEmissions, emissionFactorsWithParts, environment, unitValue),
    [otherEmissions, emissionFactorsWithParts, unitValue, environment],
  )

  const otherGas = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter((emissionSource) => {
        if (
          (!emissionSource.validated && validatedOnly) ||
          emissionSource.subPost === SubPost.UtilisationEnDependance
        ) {
          return false
        }

        const emissionFactor = emissionFactorsWithParts.find(
          (emissionFactor) => emissionFactor.id === emissionSource.emissionFactor?.id,
        )
        return (
          !!emissionFactor?.otherGES ||
          emissionFactor?.emissionFactorParts.some((emissionFactorPart) => emissionFactorPart.otherGES)
        )
      }),
    [emissionFactorsWithParts, emissionSourcesForSelectedSite, validatedOnly],
  )

  const otherGasDifference = useMemo(
    () => calculEmissionSourcesDifference(otherGas, emissionFactorsWithParts, environment, unitValue),
    [otherGas, emissionFactorsWithParts, unitValue, environment],
  )

  return (
    <ConsolatedExportDifference
      study={study}
      results={results}
      exportResults={ghgpResults}
      type={Export.GHGP}
      exportDifference={
        utilisationEnDependanceValue +
        missingCaractDifference +
        immobilisationDifference +
        otherEmissionsDifference +
        otherGasDifference
      }
    >
      {hasUtilisationEnDependance && (
        <div className={styles.differenceCard}>
          <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
            <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
              <TrendingUpIcon className={styles.cardIcon} />
              <h4>{t('dependanceTitle')}</h4>
            </div>
            <div className={'align-center'}>
              <span className={styles.differenceValueNegative}>
                {utilisationEnDependanceValueToDisplay} {unit}
              </span>
            </div>
          </div>
          <div className={classNames(styles.cardContent, 'flex-col')}>
            <p className={styles.cardDescription}>{t('dependance')}</p>
            <EmissionSourceList
              studySite={studySite}
              emissionSources={utilisationEnDependanceEmissionSources}
              onClick={navigateToEmissionSource}
            />
          </div>
        </div>
      )}
      {!!missingCaract.length && (
        <div className={styles.differenceCard}>
          <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
            <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
              <WarningAmberIcon className={styles.cardIcon} />
              <h4>{t('missingCaractTitle')}</h4>
            </div>
            <div className={'align-center'}>
              <span className={styles.differenceValueNegative}>
                {formatNumber(missingCaractDifference, 0)} {unit}
              </span>
            </div>
          </div>
          <div className={classNames(styles.cardContent, 'flex-col')}>
            <p className={styles.cardDescription}>
              {t('missingCaract1')}
              <br />
              {t('missingCaract2')}
            </p>
            <EmissionSourceList
              studySite={studySite}
              emissionSources={missingCaract}
              onClick={navigateToEmissionSource}
            />
          </div>
        </div>
      )}
      {!!immobilisation.length && (
        <div className={styles.differenceCard}>
          <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
            <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
              <WarningAmberIcon className={styles.cardIcon} />
              <h4>{t('immobilisationTitle')}</h4>
            </div>
            <div className={'align-center'}>
              <span className={styles.differenceValueNegative}>
                {formatNumber(immobilisationDifference, 0)} {unit}
              </span>
            </div>
          </div>
          <div className={classNames(styles.cardContent, 'flex-col')}>
            <p className={styles.cardDescription}>{t('immobilisation1')}</p>
            <EmissionSourceList
              studySite={studySite}
              emissionSources={immobilisation}
              onClick={navigateToEmissionSource}
            />
          </div>
        </div>
      )}
      {!!otherEmissions.length && (
        <div className={styles.differenceCard}>
          <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
            <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
              <WarningAmberIcon className={styles.cardIcon} />
              <h4>{t('otherEmissionsTitle')}</h4>
            </div>
            <div className={'align-center'}>
              <span className={styles.differenceValueNegative}>
                {formatNumber(otherEmissionsDifference, 0)} {unit}
              </span>
            </div>
          </div>
          <div className={classNames(styles.cardContent, 'flex-col')}>
            <p className={styles.cardDescription}>{t('otherEmissions1')}</p>
            <EmissionSourceList
              studySite={studySite}
              emissionSources={otherEmissions}
              onClick={navigateToEmissionSource}
            />
          </div>
        </div>
      )}
      {!!otherGas.length && (
        <div className={styles.differenceCard}>
          <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
            <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
              <WarningAmberIcon className={styles.cardIcon} />
              <h4>{t('otherGasTitle')}</h4>
            </div>
            <div className={'align-center'}>
              <span className={styles.differenceValueNegative}>
                {formatNumber(otherGasDifference, 0)} {unit}
              </span>
            </div>
          </div>
          <div className={classNames(styles.cardContent, 'flex-col')}>
            <p className={styles.cardDescription}>{t('otherGas1')}</p>
            <EmissionSourceList studySite={studySite} emissionSources={otherGas} onClick={navigateToEmissionSource} />
          </div>
        </div>
      )}
    </ConsolatedExportDifference>
  )
}

export default ConsolatedGHGPDifference
