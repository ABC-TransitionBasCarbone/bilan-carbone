import Button from '@/components/base/Button'
import Modal from '@/components/modals/Modal'
import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { getEmissionSourcesTotalCo2 } from '@/services/emissionSource'
import { Post, subPostsByPost } from '@/services/posts'
import { computeBegesResult, getBegesEmissionTotal } from '@/services/results/beges'
import { computeResultsByPost } from '@/services/results/consolidated'
import { useAppEnvironmentStore } from '@/store/AppEnvironment'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import LightbulbIcon from '@mui/icons-material/LightbulbOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined'
import { Export, ExportRule, SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import styles from './ConsolatedBEGESDifference.module.css'

interface Props {
  study: FullStudy
  rules: ExportRule[]
  emissionFactorsWithParts: EmissionFactorWithParts[]
  studySite: string
  validatedOnly: boolean
}

const Difference = ({ study, rules, emissionFactorsWithParts, studySite, validatedOnly }: Props) => {
  const { environment } = useAppEnvironmentStore()
  const t = useTranslations('study.results.difference')
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')
  const unit = tUnits(study.resultsUnit)
  const unitValue = STUDY_UNIT_VALUES[study.resultsUnit]
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const navigateToEmissionSource = (emissionSourceId: string, subPost: SubPost) => {
    const post = Object.keys(subPostsByPost).find((key) => subPostsByPost[key as Post].includes(subPost)) as Post
    if (post) {
      const url = `/etudes/${study.id}/comptabilisation/saisie-des-donnees/${post}#emission-source-${emissionSourceId}`
      router.push(url)
    }
  }

  const begesRules = useMemo(() => rules.filter((rule) => rule.export === Export.Beges), [rules])
  const beges = useMemo(
    () => computeBegesResult(study, begesRules, emissionFactorsWithParts, studySite, true, validatedOnly),
    [study, begesRules, emissionFactorsWithParts, studySite, validatedOnly],
  )
  const begesTotal = formatNumber((beges.find((result) => result.rule === 'total')?.total || 0) / unitValue, 0)
  const computedResults = useMemo(
    () => computeResultsByPost(study, tPost, studySite, true, validatedOnly, undefined, environment),
    [study, studySite, tPost, validatedOnly, environment],
  )
  const computedTotal = formatNumber(
    (computedResults.find((result) => result.post === 'total')?.value || 0) / unitValue,
    0,
  )

  const utilisationEnDependance = computedResults
    .find((result) => result.post === Post.UtilisationEtDependance)
    ?.subPosts.find((subPost) => subPost.post === SubPost.UtilisationEnDependance)
  const hasUtilisationEnDependance = !!utilisationEnDependance && utilisationEnDependance.value !== 0
  // BEGES doesn't include "Utilisation en dépendance", BC does, so BEGES - BC = negative
  const utilisationEnDependanceValue = utilisationEnDependance
    ? Math.round(utilisationEnDependance.value / unitValue)
    : 0
  const utilisationEnDependanceDifference = -utilisationEnDependanceValue

  // Find an emission source for the "en dépendance" sub-post to use in navigation
  const utilisationEnDependanceEmissionSource = study.emissionSources.find(
    (emissionSource) => emissionSource.subPost === SubPost.UtilisationEnDependance,
  )

  const wasteEmissionSourcesOnStudy = study.emissionSources.filter(
    (emissionSource) =>
      emissionSource.emissionFactor &&
      emissionSource.emissionFactor.importedId &&
      wasteEmissionFactors[emissionSource.emissionFactor.importedId],
  )

  const wasteSourcesWithDifferences = useMemo(() => {
    if (!wasteEmissionSourcesOnStudy.length) {
      return []
    }

    return wasteEmissionSourcesOnStudy
      .filter((emissionSource) => (emissionSource.validated || !validatedOnly) && emissionSource.value)
      .map((emissionSource) => {
        const emissionFactor = emissionFactorsWithParts.find((ef) => ef.id === emissionSource.emissionFactor?.id)
        if (!emissionFactor || !emissionSource.value) {
          return null
        }

        const bcValue = Math.round(getEmissionSourcesTotalCo2([emissionSource], environment) / unitValue)
        const begesValue = Math.round(getBegesEmissionTotal(emissionSource, emissionFactor) / unitValue)
        const difference = begesValue - bcValue

        return {
          source: emissionSource,
          post: tPost(emissionSource.subPost),
          difference: difference,
          consolidatedValue: bcValue,
          begesValue,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && Math.abs(item.difference) >= 1)
  }, [wasteEmissionSourcesOnStudy, emissionFactorsWithParts, validatedOnly, tPost, unitValue, environment])

  const wasteTotalDifference = useMemo(() => {
    return wasteSourcesWithDifferences.reduce((total, item) => total + item.difference, 0)
  }, [wasteSourcesWithDifferences])

  const missingCaract = useMemo(
    () =>
      study.emissionSources.filter(
        (emissionSource) =>
          (emissionSource.validated || !validatedOnly) &&
          !emissionSource.caracterisation &&
          emissionSource.subPost !== SubPost.UtilisationEnDependance,
      ),
    [study.emissionSources, validatedOnly],
  )

  const missingCaractDifference = useMemo(() => {
    return missingCaract.reduce((total, emissionSource) => {
      if (!emissionSource.emissionFactor || !emissionSource.value) {
        return total
      }

      const emissionFactor = emissionFactorsWithParts.find((ef) => ef.id === emissionSource.emissionFactor?.id)
      if (!emissionFactor) {
        return total
      }

      const bcEmissionTotal = Math.round(getEmissionSourcesTotalCo2([emissionSource], environment) / unitValue)
      return total - bcEmissionTotal
    }, 0)
  }, [missingCaract, emissionFactorsWithParts, unitValue, environment])

  const maxListedEmissionSources = 10

  return begesTotal !== computedTotal ? (
    <>
      <div className={classNames(styles.button, 'flex-cc p-2 px1')} onClick={() => setOpen(true)}>
        <LightbulbIcon />
        {t('button')}
      </div>
      <Modal open={open} title={t('modalTitle')} label="computed-beges-difference" onClose={() => setOpen(false)}>
        <div className={classNames(styles.modalContent, 'flex-col')}>
          {hasUtilisationEnDependance && (
            <div className={styles.differenceCard}>
              <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
                <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
                  <TrendingUpIcon className={styles.cardIcon} />
                  <h4>{t('dependanceTitle')}</h4>
                </div>
                <div className={'align-center'}>
                  <span className={styles.differenceValueNegative}>
                    {formatNumber(utilisationEnDependanceDifference, 0)} {unit}
                  </span>
                </div>
              </div>
              <div className={classNames(styles.cardContent, 'flex-col')}>
                <p className={styles.cardDescription}>{t('dependance')}</p>
                <div className={styles.cardActions}>
                  <Button
                    onClick={() =>
                      navigateToEmissionSource(
                        utilisationEnDependanceEmissionSource?.id || '',
                        SubPost.UtilisationEnDependance,
                      )
                    }
                    color="secondary"
                    size="small"
                  >
                    {t('goToSubPost')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!!wasteSourcesWithDifferences.length && (
            <div className={styles.differenceCard}>
              <div className={classNames(styles.cardHeaderWithValue, 'align-center justify-between')}>
                <div className={classNames(styles.cardHeaderLeft, 'align-center')}>
                  <TrendingUpIcon className={styles.cardIcon} />
                  <h4>{t('wasteTitle')}</h4>
                </div>
                <div className={'align-center'}>
                  <span className={wasteTotalDifference >= 0 ? styles.differenceValue : styles.differenceValueNegative}>
                    {wasteTotalDifference > 0 ? '+' : ''}
                    {formatNumber(wasteTotalDifference, 0)} {unit}
                  </span>
                </div>
              </div>
              <div className={classNames(styles.cardContent, 'flex-col')}>
                <p className={styles.cardDescription}>{t('waste')}</p>
                <div className={styles.wasteTable}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t('tableHeaders.emissionSource')}</th>
                        <th>{t('tableHeaders.post')}</th>
                        <th>{t('tableHeaders.bilanCarbone')}</th>
                        <th>{t('tableHeaders.beges')}</th>
                        <th>{t('tableHeaders.difference')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {wasteSourcesWithDifferences.map((item) => (
                        <tr
                          key={`waste-emission-source-${item.source.id}`}
                          className={styles.clickableRow}
                          onClick={() => navigateToEmissionSource(item.source.id, item.source.subPost)}
                        >
                          <td className={styles.sourceName}>{item.source.name}</td>
                          <td className={styles.sourcePost}>{item.post}</td>
                          <td className={styles.metricValue}>
                            {formatNumber(item.consolidatedValue, 0)} {unit}
                          </td>
                          <td>
                            {formatNumber(item.begesValue, 0)} {unit}
                          </td>
                          <td className={item.difference >= 0 ? styles.differenceCell : styles.differenceCellNegative}>
                            {item.difference > 0 ? '+' : ''}
                            {formatNumber(item.difference, 0)} {unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                <div className={classNames(styles.missingSourcesList, 'wrap')}>
                  {missingCaract
                    .filter((_, i) => i < maxListedEmissionSources)
                    .map((emissionSource) => (
                      <Button
                        key={`caract-emission-source-${emissionSource.id}`}
                        onClick={() => navigateToEmissionSource(emissionSource.id, emissionSource.subPost)}
                        color="secondary"
                        size="small"
                        className={styles.missingSourceButton}
                      >
                        {emissionSource.name}
                      </Button>
                    ))}
                  {missingCaract.length > maxListedEmissionSources && (
                    <span className={styles.additionalCount}>
                      +{missingCaract.length - maxListedEmissionSources} {t('additionalMissing')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className={'justify-end'}>
            <Button onClick={() => setOpen(false)}>{t('close')}</Button>
          </div>
        </div>
      </Modal>
    </>
  ) : (
    <></>
  )
}

export default Difference
