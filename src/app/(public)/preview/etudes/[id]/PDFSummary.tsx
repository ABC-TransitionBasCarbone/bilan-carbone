'use client'

import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import { FullStudy } from '@/db/study'
import cutTheme from '@/environments/cut/theme/theme'
import { CutPost } from '@/services/posts'
import { computeResultsByPost, ResultsByPost } from '@/services/results/consolidated'
import { getResultsValues } from '@/services/study'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { ThemeProvider } from '@mui/material/styles'
import { Environment } from '@prisma/client'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import React, { useEffect, useMemo, useState } from 'react'
import { ChartsPage } from './ChartsPage'
import './pdf-summary.css'

interface SiteData {
  id: string
  fullName: string
  generalData: {
    screens: number
    entries: number
    sessions: number
  }
  results: ResultsByPost[]
}

interface Props {
  study: FullStudy
  environment: Environment
}

const PDFSummary = ({ study, environment }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tStudy = useTranslations('study.results')
  const tPdf = useTranslations('study.pdf')

  const [sitesData, setSitesData] = useState<SiteData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { computedResultsWithDep } = useMemo(
    () => getResultsValues(study, tPost, 'all', false, study.organizationVersion.environment, tStudy),
    [study, tPost, tStudy],
  )

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        const sitesData: SiteData[] = []

        for (const studySite of study.sites) {
          const siteComputedResults = computeResultsByPost(
            study,
            tPost,
            studySite.id,
            true,
            false,
            CutPost,
            environment,
          )

          const siteResults = siteComputedResults.map((result) => ({
            ...result,
            value: result.value / STUDY_UNIT_VALUES[study.resultsUnit],
            subPosts: result.children
              .filter((subPost) => subPost.value > 0)
              .map((subPost) => ({
                ...subPost,
                value: subPost.value / STUDY_UNIT_VALUES[study.resultsUnit],
              })),
          }))

          sitesData.push({
            id: studySite.id,
            fullName: `${studySite.site.name} - ${studySite.site.city || ''}`,
            generalData: {
              screens: studySite.site.cnc?.ecrans || 0,
              entries: studySite.numberOfTickets || 0,
              sessions: studySite.numberOfSessions || 0,
            },
            results: siteResults,
          })
        }

        setSitesData(sitesData)
      } catch (error) {
        console.error('Error loading PDF data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [environment, study, tPost])

  if (isLoading) {
    return (
      <ThemeProvider theme={cutTheme}>
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
    <ThemeProvider theme={cutTheme}>
      <div className="pdf-container" data-testid="pdf-container">
        <div className="pdf-page-header flex align-center justify-center">
          <Image src="/logos/cut/logo-filled.svg" alt="COUNT Logo" width={100} height={40} />
        </div>

        <div className="pdf-page-footer flex align-center justify-between">
          <div className="pdf-page-footer-logos flex align-center">
            <Image src="/logos/cut/CUT.svg" alt="CUT Logo" width={80} height={30} />
            <Image src="/logos/cut/ABC.svg" alt="ABC Logo" width={80} height={30} />
            <Image src="/logos/cut/CNC.svg" alt="CNC Logo" width={80} height={30} />
            <Image src="/logos/cut/France3_2025_blanc.png" alt="France 2030 Logo" width={80} height={30} />
          </div>
        </div>

        <div className="pdf-content pdf-page-content">
          <div className="pdf-header-section page-break-avoid">
            <h1 className="pdf-title">{tPdf('title', { year: study.startDate.getFullYear() })}</h1>
          </div>

          <div className="pdf-cinemas-list page-break-avoid">
            <span>
              <h2 className="pdf-cinemas-title">{tPdf('cinemas.list')}:</h2>
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
                <div className="pdf-data-label">{tPdf('labels.cinemas')}</div>
                <div className="pdf-data-value">{sitesData.length}</div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">{tPdf('labels.screens')}</div>
                <div className="pdf-data-value">
                  {sitesData.reduce((sum, site) => sum + site.generalData.screens, 0)}
                </div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">{tPdf('labels.entries')}</div>
                <div className="pdf-data-value">
                  {formatNumber(sitesData.reduce((sum, site) => sum + site.generalData.entries, 0))}
                </div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">{tPdf('labels.sessions')}</div>
                <div className="pdf-data-value">
                  {formatNumber(sitesData.reduce((sum, site) => sum + site.generalData.sessions, 0))}
                </div>
              </div>
            </div>

            <ConsolidatedResultsTable
              resultsUnit={study.resultsUnit}
              data={computedResultsWithDep}
              hiddenUncertainty
              hideExpandIcons
            />
          </div>
        </div>

        <ChartsPage study={study} studySite="all" siteName="" tPdf={tPdf} isAll />

        <div className="pdf-content page-break-before pdf-page-content">
          <div className="pdf-section">
            <h2 className="pdf-totals-header pdf-header-with-border">{tPdf('additionalInfo')}</h2>
            <div className="pdf-info-section mt2">
              <div className="pdf-info-text">
                <p>{tStudy('info')}</p>
              </div>
            </div>
          </div>
        </div>

        {sitesData.map((site) => (
          <React.Fragment key={site.id}>
            <div className="pdf-content page-break-before pdf-page-content">
              <div className="pdf-section">
                <h2 className="pdf-cinema-header pdf-header-with-border">
                  {tPdf('results.site', { site: site.fullName })}
                </h2>

                <div className="pdf-general-data flex justify-between">
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">{tPdf('labels.screens')}</div>
                    <div className="pdf-data-value">{site.generalData.screens}</div>
                  </div>
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">{tPdf('labels.entries')}</div>
                    <div className="pdf-data-value">{formatNumber(site.generalData.entries)}</div>
                  </div>
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">{tPdf('labels.sessions')}</div>
                    <div className="pdf-data-value">{formatNumber(site.generalData.sessions)}</div>
                  </div>
                </div>

                <ConsolidatedResultsTable
                  resultsUnit={study.resultsUnit}
                  data={site.results}
                  hiddenUncertainty
                  expandAll
                  hideExpandIcons
                  isCompact
                />
              </div>
            </div>
            <ChartsPage study={study} studySite={site.id} siteName={site.fullName} tPdf={tPdf} isAll={false} />
          </React.Fragment>
        ))}
      </div>
    </ThemeProvider>
  )
}

export default PDFSummary
