import Modal from '@/components/modals/Modal'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import type { FullStudy } from '@/db/study'
import { customRich } from '@/i18n/customRich'
import { getEmissionResults } from '@/services/emissionSource'
import { PostInfos } from '@/services/results/exports'
import { ResultsByPost } from '@/types/study.types'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import LightbulbIcon from '@mui/icons-material/LightbulbOutlined'
import { Alert } from '@mui/material'
import { Environment, Export, SubPost } from '@repo/db-common/enums'
import { Button } from '@repo/ui'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { ReactNode, useMemo, useState } from 'react'
import styles from './ConsolidatedExportDifference.module.css'

interface EmissionSourceListProps {
  studySite: string
  emissionSources: FullStudy['emissionSources']
  onClick: (sourceId: string, subPost: SubPost) => void
}

export const EmissionSourceList = ({ studySite, emissionSources, onClick }: EmissionSourceListProps) => {
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

export const calculateEmissionSourcesDifference = (
  emissionSources: FullStudy['emissionSources'],
  emissionFactorsWithParts: EmissionFactorWithParts[],
  environment: Environment,
  unitValue: number,
) =>
  emissionSources.reduce((total, emissionSource) => {
    if (!emissionSource.emissionFactor || !emissionSource.value) {
      return total
    }

    const emissionFactor = emissionFactorsWithParts.find((ef) => ef.id === emissionSource.emissionFactor?.id)
    if (!emissionFactor) {
      return total
    }

    const bcEmissionTotal = getEmissionResults(emissionSource, environment).emissionValue / unitValue
    return total - bcEmissionTotal
  }, 0)

interface Props {
  study: FullStudy
  consolidatedResults: ResultsByPost[]
  exportResults: PostInfos[]
  type: Export
  exportDifference: number
  children: ReactNode
}

const ConsolidatedExportDifference = ({
  study,
  consolidatedResults,
  exportResults,
  type,
  exportDifference,
  children,
}: Props) => {
  const tAction = useTranslations('common.action')
  const t = useTranslations('study.results.difference')
  const tExports = useTranslations('exports')
  const unitValue = STUDY_UNIT_VALUES[study.resultsUnit]
  const [open, setOpen] = useState(false)

  const exportTotalNumber = (exportResults.find((result) => result.rule === 'total')?.total || 0) / unitValue
  const computedTotalNumber = (consolidatedResults.find((result) => result.post === 'total')?.value || 0) / unitValue
  const exportTotal = formatNumber(exportTotalNumber, 0)
  const computedTotal = formatNumber(computedTotalNumber, 0)

  const unexplainedDifference = useMemo(
    () => Math.abs(exportTotalNumber - (computedTotalNumber + exportDifference)) > 1,
    [exportTotalNumber, computedTotalNumber, exportDifference],
  )

  return exportTotal !== computedTotal ? (
    <>
      <div className={classNames(styles.button, 'flex-cc p-2 px1')} onClick={() => setOpen(true)}>
        <LightbulbIcon />
        {t('button', { type: tExports(type) })}
      </div>
      <Modal
        open={open}
        title={t('modalTitle')}
        label={`computed-${type.toLowerCase()}-difference`}
        onClose={() => setOpen(false)}
      >
        {unexplainedDifference && (
          <div className="flex-col mb2">
            <Alert severity="warning">
              {customRich(t, 'unexplainedDifference', {}, study.organizationVersion.environment)}
            </Alert>
          </div>
        )}
        <div className={classNames(styles.modalContent, 'flex-col')}>
          {children}

          <div className={'justify-end'}>
            <Button onClick={() => setOpen(false)}>{tAction('close')}</Button>
          </div>
        </div>
      </Modal>
    </>
  ) : null
}

export default ConsolidatedExportDifference
