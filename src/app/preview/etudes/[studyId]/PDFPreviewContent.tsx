'use client'

import StudyCharts from '@/components/study/charts/StudyCharts'
import { OrganizationVersionWithOrganization } from '@/db/organization'
import { FullStudy } from '@/db/study'
import cutTheme from '@/environments/cut/theme/theme'
import { CutPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { mapResultsByPost } from '@/services/results/utils'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { ThemeProvider } from '@mui/material/styles'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import './pdf-styles.css'

interface SiteData {
  id: string
  name: string
  city: string
  generalData: {
    screens: number
    entries: number
    sessions: number
    movies: number
  }
  results: Array<{
    post: string
    value: number
  }>
}

interface Props {
  study: FullStudy
  organization: OrganizationVersionWithOrganization
  cncDataMap: Map<
    string,
    {
      nom?: string
      commune?: string
      ecrans?: number
    } | null
  >
}

const PDFPreviewContent = ({ study, organization, cncDataMap }: Props) => {
  const tPost = useTranslations('emissionFactors.post')
  const tStudy = useTranslations('study.results')

  const [sites, setSites] = useState<SiteData[]>([])
  const [totalResults, setTotalResults] = useState<Array<{ post: string; value: number }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(0)

  const referenceYear = study.startDate.getFullYear() || new Date().getFullYear()

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)

        // Calcul des résultats totaux
        const allComputedResults = computeResultsByPost(study, tPost, 'all', true, false, CutPost)
        const totalResultsData = mapResultsByPost(allComputedResults, true)
          .filter((result) => result.post !== 'total')
          .map((result) => ({
            post: result.post,
            value: result.value / STUDY_UNIT_VALUES[study.resultsUnit],
          }))

        setTotalResults(totalResultsData)

        // Traitement de chaque site
        const sitesData: SiteData[] = []

        for (const studySite of study.sites) {
          const siteComputedResults = computeResultsByPost(study, tPost, studySite.id, true, false, CutPost)
          const siteResults = mapResultsByPost(siteComputedResults, true)
            .filter((result) => result.post !== 'total')
            .map((result) => ({
              post: result.post,
              value: result.value / STUDY_UNIT_VALUES[study.resultsUnit],
            }))

          let siteName = studySite.site.name
          let siteCity = studySite.site.city || ''
          let screens = 0

          // Récupération des données CNC pré-chargées
          const cncData = cncDataMap.get(studySite.site.id)
          if (cncData) {
            if (!siteName && cncData.nom) {
              siteName = cncData.nom
            }
            if (!siteCity && cncData.commune) {
              siteCity = cncData.commune
            }
            screens = cncData.ecrans || 0
          }

          sitesData.push({
            id: studySite.id,
            name: siteName || 'Cinéma',
            city: siteCity || 'Ville',
            generalData: {
              screens,
              entries: studySite.numberOfTickets || 0,
              sessions: studySite.numberOfSessions || 0,
              movies: 0, // Valeur par défaut car numberOfMovies n'existe pas dans le type
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
  }, [study, tPost, cncDataMap])

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
            Page <span className="pageNumber">1</span> sur <span className="totalPages">{totalPages}</span>
          </div>
        </div>

        {/* PAGE 1: TOTAUX CONSOLIDÉS */}
        <div className="pdf-content pdf-page-content">
          {/* En-tête du document */}
          <div className="pdf-header-section page-break-avoid">
            <h1 className="pdf-title">Empreinte carbone simplifiée {referenceYear}</h1>
            <p className="pdf-subtitle">COUNT V1.0 Estimation d'impact carbone</p>
          </div>

          {/* Liste des cinémas */}
          <div className="pdf-cinemas-list page-break-avoid">
            <h2 className="pdf-cinemas-title">Portant sur les cinémas suivants :</h2>
            <div className="pdf-cinemas-names">{sites.map((site) => `${site.name} - ${site.city}`).join(', ')}</div>
          </div>

          {/* Totaux consolidés - Page 1 */}
          <div className="pdf-section page-break-avoid">
            <h2 className="pdf-totals-header">Totaux consolidés - Tous cinémas</h2>

            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Poste d'émission</th>
                  <th className="text-right">Émissions ({study.resultsUnit})</th>
                </tr>
              </thead>
              <tbody>
                {totalResults.map((result, index) => (
                  <tr key={index}>
                    <td>{result.post}</td>
                    <td className="text-right">{formatNumber(result.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Résumé consolidé */}
            <div className="pdf-general-data pdf-summary-stats pdf-margin-top-30">
              <div className="pdf-data-item">
                <div className="pdf-data-label">Total cinémas</div>
                <div className="pdf-data-value">{sites.length}</div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">Total écrans</div>
                <div className="pdf-data-value">{sites.reduce((sum, site) => sum + site.generalData.screens, 0)}</div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">Total entrées</div>
                <div className="pdf-data-value">
                  {formatNumber(sites.reduce((sum, site) => sum + site.generalData.entries, 0))}
                </div>
              </div>
              <div className="pdf-data-item">
                <div className="pdf-data-label">Total séances</div>
                <div className="pdf-data-value">
                  {formatNumber(sites.reduce((sum, site) => sum + site.generalData.sessions, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2: GRAPHIQUES CONSOLIDÉS */}
        <div className="pdf-content page-break-before pdf-page-content">
          <div className="pdf-section">
            <h2 className="pdf-totals-header">Graphiques consolidés - Tous cinémas</h2>

            {/* Graphique en barres */}
            <StudyCharts
              study={study}
              studySite="all"
              type="bar"
              height={400}
              showTitle={false}
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
              showTitle={false}
              showLegend={true}
              showLabelsOnPie={true}
              validatedOnly={false}
            />
          </div>
        </div>

        {/* PAGE 3: DÉTAIL DES ÉMISSIONS PAR POSTE */}
        <div className="pdf-content page-break-before pdf-page-content">
          <div className="pdf-section">
            <h2 className="pdf-totals-header">Détail des émissions par poste - Tous cinémas</h2>

            {/* Table détaillée avec descriptions */}
            <table className="pdf-detailed-table">
              <thead>
                <tr>
                  <th className="pdf-col-40">Poste d'émission</th>
                  <th className="pdf-col-40">Description</th>
                  <th className="text-right pdf-col-20">Émissions ({study.resultsUnit})</th>
                </tr>
              </thead>
              <tbody>
                {totalResults.map((result, index) => (
                  <tr key={index}>
                    <td className="pdf-text-bold">{result.post}</td>
                    <td className="description-cell">Description du poste {result.post.toLowerCase()}</td>
                    <td className="text-right pdf-text-bold">{formatNumber(result.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Section d'information */}
            <div className="pdf-info-section pdf-margin-top-30">
              <div className="pdf-info-text">
                <p>{tStudy('info')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* PAGES PAR CINÉMA - Répéter la structure pour chaque cinéma */}
        {sites.map((site, siteIndex) => (
          <React.Fragment key={site.id}>
            {/* PAGE X: TOTAUX PAR CINÉMA */}
            <div className="pdf-content page-break-before pdf-page-content">
              <div className="pdf-section">
                <h2 className="pdf-cinema-header">
                  {site.name} - {site.city}
                </h2>

                {/* Données générales du cinéma */}
                <h3 className="pdf-subsection-title">Données générales</h3>
                <div className="pdf-general-data">
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">Nb d'écrans</div>
                    <div className="pdf-data-value">{site.generalData.screens}</div>
                  </div>
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">Nb d'entrées</div>
                    <div className="pdf-data-value">{formatNumber(site.generalData.entries)}</div>
                  </div>
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">Nb de séances</div>
                    <div className="pdf-data-value">{formatNumber(site.generalData.sessions)}</div>
                  </div>
                  <div className="pdf-data-item">
                    <div className="pdf-data-label">Nb de films</div>
                    <div className="pdf-data-value">{site.generalData.movies}</div>
                  </div>
                </div>

                {/* Résultats du cinéma */}
                <h3 className="pdf-subsection-title">Résultats par poste</h3>
                <table className="pdf-table">
                  <thead>
                    <tr>
                      <th>Poste d'émission</th>
                      <th className="text-right">Émissions ({study.resultsUnit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {site.results.map((result, index) => (
                      <tr key={index}>
                        <td>{result.post}</td>
                        <td className="text-right">{formatNumber(result.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PAGE X+1: GRAPHIQUES PAR CINÉMA */}
            <div className="pdf-content page-break-before pdf-page-content">
              <div className="pdf-section">
                <h2 className="pdf-cinema-header">Graphiques - {site.name}</h2>

                {/* Graphique en barres du cinéma */}
                <StudyCharts
                  study={study}
                  studySite={site.id}
                  type="bar"
                  height={600}
                  showTitle={false}
                  showLegend={false}
                  showLabelsOnBars={true}
                  validatedOnly={false}
                />

                {/* Graphique circulaire du cinéma */}
                <StudyCharts
                  study={study}
                  studySite={site.id}
                  type="pie"
                  height={600}
                  showTitle={false}
                  showLegend={true}
                  showLabelsOnPie={true}
                  validatedOnly={false}
                />
              </div>
            </div>

            {/* PAGE X+2: DÉTAIL PAR CINÉMA */}
            <div className="pdf-content page-break-before pdf-page-content">
              <div className="pdf-section">
                <h2 className="pdf-cinema-header">Détail des émissions - {site.name}</h2>

                {/* Table détaillée du cinéma */}
                <table className="pdf-detailed-table">
                  <thead>
                    <tr>
                      <th className="pdf-col-40">Poste d'émission</th>
                      <th className="pdf-col-40">Description</th>
                      <th className="text-right pdf-col-20">Émissions ({study.resultsUnit})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {site.results.map((result, index) => (
                      <tr key={index}>
                        <td className="pdf-text-bold">{result.post}</td>
                        <td className="description-cell">
                          Détail pour {site.name} - {result.post.toLowerCase()}
                        </td>
                        <td className="text-right pdf-text-bold">{formatNumber(result.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Comparaison avec le total */}
                <div className="pdf-comparison-section">
                  <h4 className="pdf-comparison-title">Part de {site.name} dans le total consolidé</h4>
                  <div>
                    {site.results.map((siteResult) => {
                      const totalResult = totalResults.find((tr) => tr.post === siteResult.post)
                      const percentage =
                        totalResult && totalResult.value > 0
                          ? ((siteResult.value / totalResult.value) * 100).toFixed(1)
                          : '0'
                      return (
                        <div key={siteResult.post} className="pdf-comparison-item">
                          <strong>{siteResult.post}:</strong> {percentage}% du total
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </ThemeProvider>
  )
}

export default PDFPreviewContent
