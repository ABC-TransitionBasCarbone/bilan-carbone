import Button from '@/components/base/Button'
import { FullStudy } from '@/db/study'
import UpgradeIcon from '@mui/icons-material/Upgrade'
import { EmissionFactorImportVersion } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import styles from './StudyVersions.module.css'

interface Props {
  study: FullStudy
  emissionFactorSources: EmissionFactorImportVersion[]
}

const StudyVersions = ({ study, emissionFactorSources }: Props) => {
  const t = useTranslations('study.rights.versions')
  const tSources = useTranslations('emissionFactors.table')
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

  return (
    <div className="flex-col grow">
      <p className="bold mb-2">{t('list')} :</p>
      <ul>
        {sources.map((source) => (
          <li key={source.source} className={classNames(styles.source, 'flex align-center mb-2')}>
            {tSources(source.source)} {source.name}
            {source.upgradable && (
              <div className="ml1">
                <Button className={styles.upgradeButton}>
                  <UpgradeIcon />
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default StudyVersions
