'use client'

import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import { FullStudy } from '@/db/study'
import cutTheme from '@/environments/cut/theme/theme'
import { convertCountToBilanCarbone, CutPost } from '@/services/posts'
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
  const tExports = useTranslations('exports')

  const [sitesData, setSitesData] = useState<SiteData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { computedResultsWithDep } = useMemo(
    () => getResultsValues(study, tPost, 'all', false, study.organizationVersion.environment, tStudy),
    [study, tPost, tStudy],
  )

  const bilanCarboneEquivalent = useMemo(() => {
    return convertCountToBilanCarbone(computedResultsWithDep).map((result) => ({
      ...result,
      bilanCarboneCategory: `${result.bilanCarboneCategory}`,
    }))
  }, [computedResultsWithDep])

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

        {environment === Environment.CUT && bilanCarboneEquivalent.length > 0 && (
          <>
            <div className="pdf-content page-break-before pdf-page-content">
              <div className="pdf-section">
                <h2 className="pdf-totals-header pdf-header-with-border">{tExports('bc.title')}</h2>

                <div className="pdf-info-section" style={{ marginBottom: '1rem' }}>
                  <div className="pdf-info-text">
                    <p style={{ margin: '0 0 0.5rem 0' }}>
                      Attention, les résultats que vous obtenez ici sont uniquement issus de l'empreinte carbone
                      simplifiée Count, et ne doivent en aucun cas être utilisés comme des résultats Bilan Carbone®. La
                      démarche que vous avez suivi via l'outil Count n'est PAS une démarche Bilan Carbone®.
                    </p>
                    <p style={{ margin: '0.5rem 0 0 0' }}>
                      En revanche, cette empreinte carbone simplifiée est le premier pas vers une démarche plus complète
                      comme le Bilan Carbone® ! Un Bilan Carbone® suit une{' '}
                      <a href="https://www.bilancarbone-methode.com/" target="_blank">
                        méthodologie bien précise
                      </a>
                      , et doit répondre à un certain nombre de critères objectifs. Par exemple, au cours d'un Bilan
                      Carbone®, la direction doit être engagée, les différentes parties prenantes de l'organisation
                      doivent être mobilisées, des incertitudes doivent être calculées et associées aux émissions, et
                      surtout, un plan de transition solide doit être construit pour engager l'organisation dans une
                      transition bas carbone. Si vous souhaitez vous lancer dans un Bilan Carbone® dans les années qui
                      viennent, tout commence par{' '}
                      <a href="https://abc-transitionbascarbone.fr/agir/se-former-au-bilan-carbone/" target="_blank">
                        se faire former
                      </a>
                      , ou par se faire accompagner par un{' '}
                      <a
                        href="https://abc-transitionbascarbone.fr/les-acteurs/annuaire-des-prestataires/"
                        target="_blank"
                      >
                        prestataire externe
                      </a>{' '}
                      !
                    </p>
                  </div>
                </div>

                <h2 className="pdf-cinema-header pdf-header-with-border">Tous cinémas</h2>

                <ConsolidatedResultsTable
                  resultsUnit={study.resultsUnit}
                  data={[
                    ...bilanCarboneEquivalent.map((result) => ({
                      post: result.bilanCarboneCategory as 'total',
                      label: result.bilanCarboneCategory,
                      value: result.value,
                      monetaryValue: 0,
                      nonSpecificMonetaryValue: 0,
                      numberOfEmissionSource: 0,
                      numberOfValidatedEmissionSource: 0,
                      uncertainty: 1,
                      children: [],
                    })),
                    {
                      post: 'total' as const,
                      label: 'Total',
                      value: bilanCarboneEquivalent.reduce((sum, result) => sum + result.value, 0),
                      monetaryValue: 0,
                      nonSpecificMonetaryValue: 0,
                      numberOfEmissionSource: 0,
                      numberOfValidatedEmissionSource: 0,
                      uncertainty: 1,
                      children: [],
                    },
                  ]}
                  hiddenUncertainty
                  hideExpandIcons
                />
              </div>
            </div>

            {sitesData.map((site) => {
              const { computedResultsWithDep: siteResults } = getResultsValues(
                study,
                tPost,
                site.id,
                false,
                environment,
                tStudy,
              )
              const siteBilanCarboneEquivalent = convertCountToBilanCarbone(siteResults)
              return (
                <div key={`bilan-carbone-${site.id}`} className="pdf-content page-break-before pdf-page-content">
                  <div className="pdf-section">
                    <h2 className="pdf-totals-header pdf-header-with-border">
                      {tExports('bc.title')} - {site.fullName}
                    </h2>

                    <ConsolidatedResultsTable
                      resultsUnit={study.resultsUnit}
                      data={[
                        ...siteBilanCarboneEquivalent.map((result) => ({
                          post: result.bilanCarboneCategory as 'total',
                          label: result.bilanCarboneCategory,
                          value: result.value,
                          monetaryValue: 0,
                          nonSpecificMonetaryValue: 0,
                          numberOfEmissionSource: 0,
                          numberOfValidatedEmissionSource: 0,
                          uncertainty: 1,
                          children: [],
                        })),
                        {
                          post: 'total' as const,
                          label: 'Total',
                          value: siteBilanCarboneEquivalent.reduce((sum, result) => sum + result.value, 0),
                          monetaryValue: 0,
                          nonSpecificMonetaryValue: 0,
                          numberOfEmissionSource: 0,
                          numberOfValidatedEmissionSource: 0,
                          uncertainty: 1,
                          children: [],
                        },
                      ]}
                      hiddenUncertainty
                      hideExpandIcons
                    />
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </ThemeProvider>
  )
}

export default PDFSummary
