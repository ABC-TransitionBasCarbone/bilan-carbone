'use client'

import StudyCharts from '@/components/study/charts/StudyCharts'
import { FullStudy } from '@/db/study'
import cutTheme from '@/environments/cut/theme/theme'
import { CutPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { ThemeProvider } from '@mui/material/styles'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import './pdf-styles.css'

import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import { ResultsByPost } from '@/services/results/consolidated'

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
}

const PDFPreviewContent = ({ study }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tStudy = useTranslations('study.results')

  const [sites, setSites] = useState<SiteData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)

  const referenceYear = study.startDate.getFullYear() || new Date().getFullYear()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Traitement de chaque site
        const sitesData: SiteData[] = []

        for (const studySite of study.sites) {
          const siteComputedResults = computeResultsByPost(study, tPost, studySite.id, true, false, CutPost)
          const siteResults = siteComputedResults
            .filter((result) => result.post !== 'total')
            .map((result) => ({
              ...result,
              value: result.value / STUDY_UNIT_VALUES[study.resultsUnit],
              subPosts: result.subPosts
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

        setSites(sitesData)

        // Calculer le nombre total de pages
        // 3 pages consolidées + 3 pages par site
        const calculatedTotalPages = 3 + sitesData.length * 3
        setTotalPages(calculatedTotalPages)
      } catch (error) {
        console.error('Error loading PDF data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [study, tPost])

  if (isLoading) {
    return (
      <ThemeProvider theme={cutTheme}>
        <div className="pdf-container">
          <div className="pdf-content">
            <div className="pdf-header-section">
              <p>Chargement des données...</p>
            </div>
          </div>
        </div>
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider theme={cutTheme}>
      <div className="pdf-container">
        {/* Header intégré dans le contenu */}
        <div className="pdf-page-header">
          <Image src="/logos/cut/COUNT.png" alt="COUNT Logo" width={100} height={40} />
        </div>

        {/* Footer intégré dans le contenu */}
        <div className="pdf-page-footer">
          <div className="pdf-page-footer-logos pdf-flex pdf-gap-20">
            <Image src="/logos/cut/CUT.png" alt="CUT Logo" width={80} height={30} />
            <Image src="/logos/cut/CNC.png" alt="CNC Logo" width={80} height={30} />
            <Image src="/logos/cut/France3_2025.png" alt="France 2030 Logo" width={80} height={30} />
          </div>
          <div className="pdf-page-number">
            Page <span className="pageNumber" /> sur <span className="totalPages">{totalPages}</span>
          </div>
        </div>

        {/* PAGE 1: TOTAUX CONSOLIDÉS */}
        <div className="pdf-content pdf-page-content">
          {/* En-tête du document */}
          <div className="pdf-header-section page-break-avoid">
            <h1 className="pdf-title">Empreinte carbone simplifiée {referenceYear}</h1>
          </div>

          {/* Liste des cinémas */}
          <div className="pdf-cinemas-list page-break-avoid">
            <span>
              <h2 className="pdf-cinemas-title">Portant sur les cinémas suivants :</h2>
              <ul>
                {sites.map((site) => (
                  <li key={site.id}>{site.fullName}</li>
                ))}
              </ul>
            </span>
          </div>

          {/* Totaux consolidés - Page 1 */}
          <div className="pdf-section page-break-avoid">
            <h2 className="pdf-totals-header">Résultats - Tous cinémas</h2>

            {/* Résumé consolidé */}
            <div className="pdf-general-data pdf-summary-stats pdf-margin-top-30">
              <div className="pdf-data-item">
                <div className="pdf-data-label">Cinémas</div>
                <div className="pdf-data-value">{sites.length}</div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">Écrans</div>
                <div className="pdf-data-value">{sites.reduce((sum, site) => sum + site.generalData.screens, 0)}</div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">Entrées</div>
                <div className="pdf-data-value">
                  {formatNumber(sites.reduce((sum, site) => sum + site.generalData.entries, 0))}
                </div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">Séances</div>
                <div className="pdf-data-value">
                  {formatNumber(sites.reduce((sum, site) => sum + site.generalData.sessions, 0))}
                </div>
              </div>
            </div>

            <ConsolidatedResultsTable
              study={study}
              studySite="all"
              withDependencies={false}
              hiddenUncertainty
              hideExpandIcons
            />
          </div>
        </div>

        {/* PAGE 2: GRAPHIQUES CONSOLIDÉS */}
        <div className="pdf-content page-break-before pdf-page-content">
          <div className="pdf-section">
            <h2 className="pdf-totals-header">Graphiques - Tous cinémas</h2>

            {/* Graphique en barres */}
            <StudyCharts
              study={study}
              studySite="all"
              type="bar"
              height={350}
              showTitle={true}
              title="Émissions dues aux activités de l'ensemble des cinémas, en tCO2e"
              showLegend={false}
              showLabelsOnBars={true}
              validatedOnly={false}
            />

            {/* Graphique circulaire */}
            <StudyCharts
              study={study}
              studySite="all"
              type="pie"
              height={400}
              showTitle={true}
              title="Émissions dues aux activités de l'ensemble des cinémas, en tCO2e"
              showLegend={true}
              showLabelsOnPie={true}
              validatedOnly={false}
            />
          </div>
        </div>

        {/* PAGE 3: DÉTAIL DES ÉMISSIONS PAR POSTE */}
        <div className="pdf-content page-break-before pdf-page-content">
          <div className="pdf-section">
            <h2 className="pdf-totals-header">Informations complémentaires</h2>
            {/* Section d'information */}
            <div className="pdf-info-section pdf-margin-top-30">
              <div className="pdf-info-text">
                <p>{tStudy('info')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* PAGES PAR CINÉMA - Répéter la structure pour chaque cinéma */}
        {sites.map((site) => (
          <React.Fragment key={site.id}>
            {/* PAGE X: TOTAUX PAR CINÉMA */}
            <div className="pdf-content page-break-before pdf-page-content">
              <div className="pdf-section">
                <h2 className="pdf-cinema-header">Résultats - {site.fullName}</h2>

                {/* Données générales du cinéma */}
                <div className="pdf-general-data">
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">Écrans</div>
                    <div className="pdf-data-value">{site.generalData.screens}</div>
                  </div>
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">Entrées</div>
                    <div className="pdf-data-value">{formatNumber(site.generalData.entries)}</div>
                  </div>
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">Séances</div>
                    <div className="pdf-data-value">{formatNumber(site.generalData.sessions)}</div>
                  </div>
                </div>

                {/* Résultats du cinéma */}
                <ConsolidatedResultsTable
                  study={study}
                  studySite={site.id}
                  withDependencies={false}
                  hiddenUncertainty
                  expandAll
                  hideExpandIcons
                />
              </div>
            </div>

            {/* PAGE X+1: GRAPHIQUES PAR CINÉMA */}
            <div className="pdf-content page-break-before pdf-page-content">
              <div className="pdf-section">
                <h2 className="pdf-cinema-header">Graphiques - {site.fullName}</h2>

                {/* Graphique en barres du cinéma */}
                <StudyCharts
                  study={study}
                  studySite={site.id}
                  type="bar"
                  height={350}
                  showTitle={true}
                  title={`Émissions dues aux activités du cinéma ${site.fullName}, en tCO2e`}
                  showLegend={false}
                  showLabelsOnBars={true}
                  validatedOnly={false}
                />

                {/* Graphique circulaire du cinéma */}
                <StudyCharts
                  study={study}
                  studySite={site.id}
                  type="pie"
                  height={400}
                  showTitle={true}
                  title={`Émissions dues aux activités du cinéma ${site.fullName}, en tCO2e`}
                  showLegend={true}
                  showLabelsOnPie={true}
                  validatedOnly={false}
                />
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </ThemeProvider>
  )
}

export default PDFPreviewContent
