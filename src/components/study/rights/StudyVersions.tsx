import Button from '@/components/base/Button'
import Modal from '@/components/modals/Modal'
import { wasteEmissionFactors } from '@/constants/wasteEmissionFactors'
import { FullStudy } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  simulateStudyEmissionFactorSourceUpgrade,
  upgradeStudyEmissionFactorSource,
} from '@/services/serverFunctions/study'
import { useUnitLabel } from '@/services/unit'
import { IsSuccess } from '@/utils/serverResponse'
import { EmissionFactorImportVersion, Import, StudyResultUnit } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import styles from './StudyVersions.module.css'

interface Props {
  study: FullStudy
  emissionFactorSources: EmissionFactorImportVersion[]
  canUpdate: boolean
}

type SimulateStudyEmissionFactorSourceUpgradeResponse = IsSuccess<
  AsyncReturnType<typeof simulateStudyEmissionFactorSourceUpgrade>
>

type SimulationResult = {
  updated: Exclude<SimulateStudyEmissionFactorSourceUpgradeResponse['updated'], undefined> | []
  deleted: Exclude<SimulateStudyEmissionFactorSourceUpgradeResponse['deleted'], undefined> | []
}

const StudyVersions = ({ study, emissionFactorSources, canUpdate }: Props) => {
  const t = useTranslations('study.rights.versions')
  const tSources = useTranslations('emissionFactors.table')
  const unit = useTranslations('study.results.units')(StudyResultUnit.K)
  const getUnitLabel = useUnitLabel()
  const [source, setSource] = useState<Import | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult>({ updated: [], deleted: [] })
  const router = useRouter()
  const { callServerFunction } = useServerFunction()

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
    setSource(source)
    await callServerFunction(() => simulateStudyEmissionFactorSourceUpgrade(study.id, source), {
      getErrorMessage: (error) => t(error, { name: tSources(source || '') }),
      onSuccess: (data) => {
        setSimulationResult({ updated: data.updated || [], deleted: data.deleted || [] })
      },
    })
  }

  const upgradeSource = async (source: Import) => {
    setUpgrading(true)
    await callServerFunction(() => upgradeStudyEmissionFactorSource(study.id, source), {
      getErrorMessage: (error) => t(error, { name: tSources(source || '') }),
      onSuccess: () => {
        setSource(null)
        router.refresh()
      },
    })
    setUpgrading(false)
  }

  const getEmissionFactorName = (
    metaData: Exclude<SimulateStudyEmissionFactorSourceUpgradeResponse['updated'], undefined>[0]['metaData'],
  ) =>
    `${metaData.title}${metaData.attribute ? ` - ${metaData.attribute}` : ''}${metaData.frontiere ? ` - ${metaData.frontiere}` : ''}${metaData.location ? ` - ${metaData.location}` : ''}`

  const hasUpdatedWastedEmissionFactor = useMemo(
    () =>
      (simulationResult.updated || []).some(
        (emissionFactor) => !!wasteEmissionFactors[emissionFactor.importedId || ''],
      ),
    [simulationResult],
  )

  return (
    <div className="flex-col grow">
      <p className="bold mb-2">{t('list')} :</p>
      <ul>
        {sources.map((source) => (
          <li key={source.source} className={classNames(styles.source, 'flex align-center mb-2')}>
            {tSources(source.source)} {source.name}
            {source.upgradable && canUpdate && (
              <div className="ml1">
                <Button
                  className={styles.upgradeButton}
                  onClick={() => simulateSourceUpgrade(source.source)}
                  color="secondary"
                >
                  {t('upgradeSource')}
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
              onClick: () => upgradeSource(source),
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
              <ul className="mt-2">
                {simulationResult.updated.map((emissionFactor) => (
                  <li key={`updated-factor-${emissionFactor.id}`}>
                    <p className="ml1">
                      {getEmissionFactorName(emissionFactor.metaData)} :{' '}
                      <span className={styles.updatedValue}>{emissionFactor.totalCo2}</span> {emissionFactor.newValue}{' '}
                      {unit}/{getUnitLabel(emissionFactor.unit || '', emissionFactor.newValue)}
                      {!!wasteEmissionFactors[emissionFactor.importedId || ''] && <>*</>}
                    </p>
                  </li>
                ))}
              </ul>
              {hasUpdatedWastedEmissionFactor && <span className="mt-2">(*) : {t('wastedUpdated')}</span>}
            </>
          )}
          {!!simulationResult.deleted.length && (
            <>
              <p className="mt1">
                {t('deleted')} ({t('deletionDetails')}) :
              </p>
              <ul className="mt-2">
                {simulationResult.deleted.map((emissionFactor) => (
                  <li key={`deleted-factor-${emissionFactor.id}`}>
                    <p className="ml1">{getEmissionFactorName(emissionFactor.metaData)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Modal>
      )}
    </div>
  )
}

export default StudyVersions
