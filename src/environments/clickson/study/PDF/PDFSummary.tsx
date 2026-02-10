'use client'

import { ChartsPage } from '@/app/(public)/preview/etudes/[id]/ChartsPage'
import '@/app/(public)/preview/etudes/[id]/pdf-summary.css'
import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import { FullStudy } from '@/db/study'
import { usePublicodesResults } from '@/hooks/usePublicodesResults'
import { BaseResultsByPost } from '@/services/results/consolidated'
import { ThemeProvider } from '@mui/material/styles'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import clicksonTheme from '../../theme/theme'

interface SiteData {
  id: string
  fullName: string
  generalData: {
    studentNumber: number
    etp: number
    superficy: number
    establishmentYear: string
  }
  results: BaseResultsByPost[]
}

interface Props {
  study: FullStudy
}

// NOTE: part of the code is duplicated between Clickson and Cut, but for now
// the complexity of the components doesn't justify the effort of extracting
// common components and having a more complex structure.
const PDFSummary = ({ study }: Props) => {
  const tPdf = useTranslations('study.pdf')
  const [sitesData, setSitesData] = useState<SiteData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const results = usePublicodesResults(
    study,
    'all',
    study.organizationVersion.environment,
    // NOTE: we skip auth check here because authentification is already
    // handled by withPdfAuth.
    true,
  )

  const questions = [
    'goals',
    'shareholders',
    'otherStakeholders',
    'ressourcesToBeImplemented',
    'monitoringIndicators',
    'estimatedCarbonImpacts',
    'otherEstimatedEnvironmentalImpacts',
    'estimatedSocialImpacts',
    'calendar',
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        const sitesData: SiteData[] = study.sites.map((studySite) => {
          const siteResults = results.bySite[studySite.id] ?? []
          return {
            id: studySite.id,
            fullName: `${studySite.site.name} - ${studySite.site.city || ''}`,
            generalData: {
              etp: studySite?.etp ?? studySite?.site.etp ?? 0,
              studentNumber: studySite?.studentNumber ?? studySite?.site.studentNumber ?? 0,
              superficy: studySite?.superficy ?? studySite?.site.superficy ?? 0,
              establishmentYear: studySite.site.establishmentYear || '',
            },
            results: siteResults,
          }
        })

        setSitesData(sitesData)
      } catch (error) {
        console.error('Error loading PDF data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [study, results.bySite])

  const year = `${study.startDate.getFullYear()} - ${study.endDate.getFullYear()}`

  if (isLoading) {
    return (
      <ThemeProvider theme={clicksonTheme}>
        <div className="pdf-container">
          <div className="pdf-content">
            <div className="pdf-header-section">
              <p>{tPdf('loading')}</p>
            </div>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={clicksonTheme}>
      <div className="pdf-container" data-testid="pdf-container">
        <div className="pdf-page-header flex align-center justify-center">
          <Image src="/logos/clickson/logo.svg" alt="Clickson Logo" width={100} height={40} />
        </div>

        <div className="pdf-page-footer flex align-center justify-between">
          <div className="pdf-page-footer-logos flex align-center">
            <Image src="/logos/clickson/logo.svg" alt="Clickson Logo" width={80} height={30} />
            <Image src="/logos/cut/ABC.svg" alt="ABC Logo" width={80} height={30} />
          </div>
        </div>

        <div className="pdf-content pdf-page-content">
          <div className="pdf-header-section page-break-avoid">
            <h1 className="pdf-title">{tPdf('title', { year })}</h1>
          </div>

          <div className="pdf-cinemas-list page-break-avoid">
            <span>
              <ul>
                {sitesData.map((site) => (
                  <li key={site.id}>{site.fullName}</li>
                ))}
              </ul>
            </span>
          </div>

          <div className="pdf-section page-break-avoid">
            <h2 className="pdf-totals-header pdf-header-with-border">{tPdf('results.all')}</h2>

            <div className="pdf-general-data pdf-summary-stats flex justify-between mt2">
              <div className="pdf-data-item">
                <div className="pdf-data-label">{tPdf('labels.studentNumber')}</div>
                <div className="pdf-data-value">
                  {sitesData.reduce((sum, site) => sum + site.generalData.studentNumber, 0)}
                </div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">{tPdf('labels.etp')}</div>
                <div className="pdf-data-value">{sitesData.reduce((sum, site) => sum + site.generalData.etp, 0)}</div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">{tPdf('labels.superficy')}</div>
                <div className="pdf-data-value">
                  {sitesData.reduce((sum, site) => sum + site.generalData.superficy, 0)}
                </div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">{tPdf('labels.establishmentYear')}</div>
                <div className="pdf-data-value">{sitesData[0].generalData.establishmentYear}</div>
              </div>
            </div>

            <ConsolidatedResultsTable
              resultsUnit={study.resultsUnit}
              data={results.aggregated}
              hiddenUncertainty
              hideExpandIcons
            />
          </div>
        </div>

        {sitesData.map((site) => (
          <React.Fragment key={site.id}>
            <div className="pdf-content pdf-page-content">
              <ConsolidatedResultsTable
                resultsUnit={study.resultsUnit}
                data={site.results}
                hiddenUncertainty
                expandAll
                hideExpandIcons
                isCompact
              />
            </div>
            <ChartsPage
              results={site.results}
              studyResultUnit={study.resultsUnit}
              siteName={site.fullName}
              tPdf={tPdf}
              isAll={false}
              year={year}
            />
          </React.Fragment>
        ))}
        <div className="pdf-content page-break-before pdf-page-content">
          <div className="pdf-section">
            {questions.map((question) => (
              <div key={question}>
                <p className="pdf-question-title">{tPdf(`questions.${question}-title`)}</p>
                <p className="pdf-question-subtitle">{tPdf(`questions.${question}-subtitle`)}</p>
                <div className="pdf-field" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}

export default PDFSummary
