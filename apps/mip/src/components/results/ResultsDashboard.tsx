'use client'

import { isCsvExportDisabled } from '@/constants/survey'
import { exportSurveyResponsesToCSV } from '@/services/serverFunctions/survey'
import { SurveyResults } from '@/types/results.types'
import { getResultsForEntity } from '@/utils/survey'
import { StudyResultUnit } from '@abc-transitionbascarbone/db-common/enums'
import { useToast } from '@abc-transitionbascarbone/ui'
import { BasicTypeCharts } from '@abc-transitionbascarbone/utils/charts'
import { downloadCsvFile } from '@abc-transitionbascarbone/utils/download'
import { Print } from '@mui/icons-material'
import DownloadIcon from '@mui/icons-material/Download'
import { Button, Tooltip, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import ChartsSection from './ChartsSection'
import EntityFilterSection from './EntityFilterSection'
import KeyStatsSection from './KeyStatsSection'
import styles from './ResultsDashboard.module.css'
import StatsSection from './StatsSection'

interface Props {
  results: SurveyResults
}

const ResultsDashboard = ({ results }: Props) => {
  const t = useTranslations('results')
  const { showErrorToast } = useToast()
  const [selectedEntity, setSelectedEntity] = useState('all')

  const filtered = getResultsForEntity(results, selectedEntity)

  const chartItems = filtered.categories.map(
    (c) =>
      ({
        post: c.key,
        label: t(`categories.${c.key}`),
        value: c.value,
        color: c.color,
        children: [],
      }) as BasicTypeCharts,
  )

  const handlePrint = () => {
    window.print()
  }

  const isExportDisabled = isCsvExportDisabled(results.totalRespondents)

  const handleExportCsv = async () => {
    const result = await exportSurveyResponsesToCSV(results.surveyId)
    if (!result.success) {
      showErrorToast(result.errorMessage)
      return
    }

    downloadCsvFile(result.data.fileName, result.data.csvContent)
  }

  return (
    <div className={`${styles.page} pt2 overflow-y-auto`}>
      <section className="mb1">
        <Typography variant="h4" className="mb-2">
          {t('title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" className="mb0">
          {t('subtitle')}
        </Typography>
      </section>

      <StatsSection results={filtered} resultsUnit={StudyResultUnit.T} />

      {results.entities.length > 0 && (
        <EntityFilterSection
          entities={results.entities}
          selectedEntity={selectedEntity}
          onSelectEntity={setSelectedEntity}
        />
      )}

      <ChartsSection chartItems={chartItems} />

      <KeyStatsSection keyStats={filtered.keyStats} />

      <div className="flex gapped1 mt1">
        <Tooltip title={isExportDisabled ? t('export.disabledMinRespondents') : ''}>
          <span>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCsv}
              disabled={isExportDisabled}
              data-testid="export-data-csv-button"
            >
              {t('export.dataCsv')}
            </Button>
          </span>
        </Tooltip>
        <Button variant="outlined" startIcon={<Print />} onClick={handlePrint}>
          {t('export.print')}
        </Button>
      </div>
    </div>
  )
}

export default ResultsDashboard
