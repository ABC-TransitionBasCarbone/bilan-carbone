import Button from '@/components/base/Button'
import Modal from '@/components/modals/Modal'
import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { customRich } from '@/i18n/customRich'
import { getEnvVar } from '@/lib/environment'
import { getEmissionResults } from '@/services/emissionSource'
import { Post } from '@/services/posts'
import { BegesPostInfos, getBegesEmissionTotal } from '@/services/results/beges'
import { ResultsByPost } from '@/services/results/consolidated'
import { formatNumber } from '@/utils/number'
import { getPost } from '@/utils/post'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import LightbulbIcon from '@mui/icons-material/LightbulbOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUpOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmberOutlined'
import { Alert } from '@mui/material'
import { SubPost } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import styles from './ConsolatedBEGESDifference.module.css'

interface Props {
  study: FullStudy
  emissionFactorsWithParts: EmissionFactorWithParts[]
  validatedOnly: boolean
  results: ResultsByPost[]
  begesResults: BegesPostInfos[]
  studySite: string
}

const EmissionSourceList = ({
  studySite,
  emissionSources,
  onClick,
}: {
  studySite: string
  emissionSources: FullStudy['emissionSources']
  onClick: (sourceId: string, subPost: SubPost) => void
}) => {
  const t = useTranslations('study.results.difference')
  const maxButtonEmissionSources = 10

  return (
    <div className={classNames(styles.missingSourcesList, 'wrap')}>
      {emissionSources
        .filter((_, i) => i < maxButtonEmissionSources)
        .map((emissionSource) => (
          <Button
            key={`emission-source-${emissionSource.id}`}
            onClick={() => onClick(emissionSource.id, emissionSource.subPost)}
            color="secondary"
            variant="outlined"
            size="small"
            className={styles.missingSourceButton}
          >
            {emissionSource.name}
            {studySite === 'all' && ` (${emissionSource.studySite.site.name})`}
          </Button>
        ))}
      {emissionSources.length > maxButtonEmissionSources && (
        <div className={classNames(styles.additionalMissingSources, 'mt-2')}>
          {t('additionalMissing', {
            count: emissionSources.length - 10,
          })}
        </div>
      )}
    </div>
  )
}

const ConsolatedBEGESDifference = ({
  study,
  emissionFactorsWithParts,
  validatedOnly,
  results,
  begesResults,
  studySite,
}: Props) => {
  const tCommon = useTranslations('common')
  const t = useTranslations('study.results.difference')
  const tPost = useTranslations('emissionFactors.post')
  const tUnits = useTranslations('study.results.units')
  const unit = tUnits(study.resultsUnit)
  const unitValue = STUDY_UNIT_VALUES[study.resultsUnit]
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const contactMail = getEnvVar('SUPPORT_EMAIL', study.organizationVersion.environment)

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

  const begesTotalNumber = (begesResults.find((result) => result.rule === 'total')?.total || 0) / unitValue
  const computedTotalNumber = (results.find((result) => result.post === 'total')?.value || 0) / unitValue
  const begesTotal = formatNumber(begesTotalNumber, 0)
  const computedTotal = formatNumber(computedTotalNumber, 0)

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
  // BEGES doesn't include "Utilisation en dépendance", BC does, so BEGES - BC = negative
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

  const wasteEmissionSources = useMemo(
    () =>
      emissionSourcesForSelectedSite.filter(
        (emissionSource) =>
          emissionSource.emissionFactor &&
          emissionSource.emissionFactor.importedId &&
          wasteEmissionFactors[emissionSource.emissionFactor.importedId],
      ),
    [emissionSourcesForSelectedSite],
  )

  const wasteSourcesWithDifferences = useMemo(() => {
    if (!wasteEmissionSources.length) {
      return []
    }

    return wasteEmissionSources
      .filter((emissionSource) => (emissionSource.validated || !validatedOnly) && emissionSource.value)
      .map((emissionSource) => {
        const emissionFactor = emissionFactorsWithParts.find((ef) => ef.id === emissionSource.emissionFactor?.id)
        if (!emissionFactor || !emissionSource.value) {
          return null
        }

        const begesValue = getBegesEmissionTotal(emissionSource, emissionFactor) / unitValue
        const consolidatedValue = getEmissionResults(emissionSource, environment).emissionValue / unitValue
        const begesValueToDisplay = formatNumber(Math.round(begesValue), 0)
        const consolidatedValueToDisplay = formatNumber(Math.round(consolidatedValue), 0)
        const difference = begesValue - consolidatedValue

        return {
          source: emissionSource,
          post: tPost(emissionSource.subPost),
          difference,
          differenceToDisplay: formatNumber(Math.round(difference), 0),
          consolidatedValueToDisplay,
          begesValueToDisplay,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && Math.abs(Math.round(item.difference)) >= 1)
  }, [wasteEmissionSources, emissionFactorsWithParts, validatedOnly, tPost, unitValue, environment])

  const wasteTotalDifference = useMemo(() => {
    return wasteSourcesWithDifferences.reduce((total, item) => total + item.difference, 0)
  }, [wasteSourcesWithDifferences])

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

  const missingCaractDifference = useMemo(() => {
    return missingCaract.reduce((total, emissionSource) => {
      if (!emissionSource.emissionFactor || !emissionSource.value) {
        return total
      }

      const emissionFactor = emissionFactorsWithParts.find((ef) => ef.id === emissionSource.emissionFactor?.id)
      if (!emissionFactor) {
        return total
      }

      const bcEmissionTotal = Math.round(getEmissionResults(emissionSource, environment).emissionValue / unitValue)
      return total - bcEmissionTotal
    }, 0)
  }, [missingCaract, emissionFactorsWithParts, unitValue, environment])

  const unexplainedDifference = useMemo(() => {
    return (
      Math.floor(begesTotalNumber) +
        1 -
        Math.floor(
          computedTotalNumber + utilisationEnDependanceValue + wasteTotalDifference + missingCaractDifference,
        ) >
      1
    )
  }, [
    begesTotalNumber,
    computedTotalNumber,
    missingCaractDifference,
    utilisationEnDependanceValue,
    wasteTotalDifference,
  ])

  return begesTotal !== computedTotal ? (
    <>
      <div className={classNames(styles.button, 'flex-cc p-2 px1')} onClick={() => setOpen(true)}>
        <LightbulbIcon />
        {t('button')}
      </div>
      <Modal open={open} title={t('modalTitle')} label="computed-beges-difference" onClose={() => setOpen(false)}>
        {unexplainedDifference && (
          <div className="flex-col mb2">
            <Alert severity="warning">
              {customRich(t, 'unexplainedDifference', {}, study.organizationVersion.environment)}
            </Alert>
          </div>
        )}
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
                          <td className={styles.sourceName}>
                            {item.source.name}
                            {studySite === 'all' && ` (${item.source.studySite.site.name})`}
                          </td>
                          <td className={styles.sourcePost}>{item.post}</td>
                          <td className={styles.metricValue}>
                            {item.consolidatedValueToDisplay} {unit}
                          </td>
                          <td>
                            {item.begesValueToDisplay} {unit}
                          </td>
                          <td className={item.difference >= 0 ? styles.differenceCell : styles.differenceCellNegative}>
                            {item.difference > 0 ? '+' : ''}
                            {item.differenceToDisplay} {unit}
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
                <EmissionSourceList
                  studySite={studySite}
                  emissionSources={missingCaract}
                  onClick={navigateToEmissionSource}
                />
              </div>
            </div>
          )}

          <div className={'justify-end'}>
            <Button onClick={() => setOpen(false)}>{tCommon('close')}</Button>
          </div>
        </div>
      </Modal>
    </>
  ) : (
    <></>
  )
}

export default ConsolatedBEGESDifference
