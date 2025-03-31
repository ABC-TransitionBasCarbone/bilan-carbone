import Button from '@/components/base/Button'
import Modal from '@/components/modals/Modal'
import { getEmissionFactorsByImportedIdsAndVersion } from '@/db/emissionFactors'
import { FullStudy } from '@/db/study'
import { simulateStudyEmissionFactorSourceUpgrade } from '@/services/serverFunctions/study'
import UpgradeIcon from '@mui/icons-material/Upgrade'
import { EmissionFactorImportVersion, Import, StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import styles from './StudyVersions.module.css'

interface Props {
  study: FullStudy
  emissionFactorSources: EmissionFactorImportVersion[]
}

type SimulationResult = {
  updated: (AsyncReturnType<typeof getEmissionFactorsByImportedIdsAndVersion>[0] & { newValue: number })[]
  deleted: AsyncReturnType<typeof getEmissionFactorsByImportedIdsAndVersion>
}

const StudyVersions = ({ study, emissionFactorSources }: Props) => {
  const t = useTranslations('study.rights.versions')
  const tSources = useTranslations('emissionFactors.table')
  const tUnits = useTranslations('units')
  const unit = useTranslations('study.results.units')(StudyResultUnit.K)
  const [error, setError] = useState('')
  const [source, setSource] = useState<Import | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult>({ updated: [], deleted: [] })
  const isUpgradable = (source: EmissionFactorImportVersion) =>
    emissionFactorSources.some(
      (emissionFactorSource) =>
        emissionFactorSource.source === source.source && emissionFactorSource.createdAt > source.createdAt,
    )

  const sources = study.emissionFactorVersions
    .map((emissionFactorVersion) =>
      emissionFactorSources.find(
        (emissionFactorSource) => emissionFactorSource.id === emissionFactorVersion.importVersionId,
      ),
    )
    .filter((source) => source !== undefined)
    .map((source) => ({
      ...source,
      upgradable: isUpgradable(source),
    }))

  const simulateSourceUpgrade = async (source: Import) => {
    setError('')
    setSource(source)
    const res = await simulateStudyEmissionFactorSourceUpgrade(study.id, source)
    if (!res.success) {
      setError(res.message || '')
    } else {
      setSimulationResult({ updated: res.updated || [], deleted: res.deleted || [] })
    }
  }

  const getEmissionFactorName = (
    emissionFactor: AsyncReturnType<typeof getEmissionFactorsByImportedIdsAndVersion>[0],
  ) =>
    `${emissionFactor.metaData[0].title}${emissionFactor.metaData[0].attribute ? ` - ${emissionFactor.metaData[0].attribute}` : ''}${emissionFactor.metaData[0].frontiere ? ` - ${emissionFactor.metaData[0].frontiere}` : ''}${emissionFactor.metaData[0].location ? ` - ${emissionFactor.metaData[0].location}` : ''}`

  return (
    <div className="flex-col grow">
      <p className="bold mb-2">{t('list')} :</p>
      <ul>
        {sources.map((source) => (
          <li key={source.source} className={classNames(styles.source, 'flex align-center mb-2')}>
            {tSources(source.source)} {source.name}
            {source.upgradable && (
              <div className="ml1">
                <Button
                  className={styles.upgradeButton}
                  onClick={() => simulateSourceUpgrade(source.source)}
                  aria-label={t('upgradeSource')}
                  title={t('upgradeSource')}
                >
                  <UpgradeIcon />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!!source && (
        <Modal
          open
          label="update-emission-factor-version"
          title={t('title', { name: tSources(source) })}
          onClose={() => setSource(null)}
          actions={[
            {
              actionType: 'button',
              onClick: () => setSource(null),
              children: t('cancel'),
              ['data-testid']: 'cancel-emission-source-update',
            },
            {
              actionType: 'loadingButton',
              onClick: () => setUpgrading(true),
              loading: upgrading,
              children: t('confirm'),
              ['data-testid']: 'confirm-emission-source-update',
            },
          ]}
        >
          {!simulationResult.updated.length && !simulationResult.deleted.length && <p>{t('unchanged')}</p>}
          {!!simulationResult.updated.length && (
            <>
              <p>{t('updated')} :</p>
              <ul>
                {simulationResult.updated.map((emissionFactor) => (
                  <li key={`updated-factor-${emissionFactor.id}`}>
                    <p className="ml1">
                      {getEmissionFactorName(emissionFactor)} :{' '}
                      <span className={styles.updatedValue}>{emissionFactor.totalCo2}</span> {emissionFactor.newValue}{' '}
                      {unit}/{tUnits(emissionFactor.unit)}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!!simulationResult.deleted.length && (
            <>
              <p className="mt1">{t('deleted')} :</p>
              <ul>
                {simulationResult.deleted.map((emissionFactor) => (
                  <li key={`deleted-factor-${emissionFactor.id}`}>
                    <p className="ml1">{getEmissionFactorName(emissionFactor)}</p>
                  </li>
                ))}
              </ul>
              <p className="mt1">{t('deletionDetails')}</p>
            </>
          )}
        </Modal>
      )}

      {error && <p className="error">{t(error, { name: tSources(source) })}</p>}
    </div>
  )
}

export default StudyVersions
