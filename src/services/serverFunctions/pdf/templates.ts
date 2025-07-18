import { formatNumber } from '@/utils/number'
import { readFileSync } from 'fs'
import path from 'path'

export interface SiteData {
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

const formatPDFNumber = (value: number) => {
  return formatNumber(value).replace(/\s/g, ' ')
}

const loadCSS = () => {
  const cssPath = path.join(process.cwd(), 'src/services/serverFunctions/pdf/styles.css')
  return readFileSync(cssPath, 'utf-8')
}

export const generateHeader = (studyName: string, referenceYear: number) => `
  <div class="header">
    <h1 class="title">Empreinte carbone simplifiée ${referenceYear}</h1>
    <p class="subtitle">COUNT V1.0 Estimation d'impact carbone</p>
  </div>
`

export const generateSitesList = (sites: SiteData[]) => {
  const sitesList = sites.map((site) => `${site.name} - ${site.city}`).join(', ')
  return `
    <div class="sites-section">
      <h2 class="sites-title">Portant sur les cinémas suivants :</h2>
      <div class="sites-list">${sitesList}</div>
    </div>
  `
}

export const generateGeneralDataSection = (generalData: SiteData['generalData']) => `
  <h3 class="section-title">Données générales</h3>
  <div class="general-data">
    <div class="data-item">
      <div class="data-label">Nombre d'écrans</div>
      <div class="data-value">${generalData.screens}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Nombre d'entrées</div>
      <div class="data-value">${formatPDFNumber(generalData.entries)}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Nombre de séances</div>
      <div class="data-value">${formatPDFNumber(generalData.sessions)}</div>
    </div>
    <div class="data-item">
      <div class="data-label">Nombre de films</div>
      <div class="data-value">${generalData.movies}</div>
    </div>
  </div>
`

export const generateResultsTable = (results: SiteData['results'], resultsUnit: string) => `
  <h3 class="section-title">Résultats de l'empreinte carbone simplifiée</h3>
  <table class="results-table">
    <thead>
      <tr>
        <th>Poste</th>
        <th>Émissions (${resultsUnit})</th>
      </tr>
    </thead>
    <tbody>
      ${results
        .map(
          (result) => `
        <tr>
          <td>${result.post}</td>
          <td>${formatPDFNumber(result.value)}</td>
        </tr>
      `,
        )
        .join('')}
    </tbody>
  </table>
`

export const generateSiteSection = (site: SiteData, resultsUnit: string) => `
  <div class="cinema-section">
    <h2 class="cinema-title">${site.name}</h2>
    ${generateGeneralDataSection(site.generalData)}
    ${generateResultsTable(site.results, resultsUnit)}
  </div>
`

export const generateTotalSection = (totalResults: Array<{ post: string; value: number }>, resultsUnit: string) => `
  <div class="cinema-section page-break">
    <h2 class="cinema-title">Total tous cinémas confondus</h2>
    <h3 class="section-title">Résultats consolidés</h3>
    <table class="results-table">
      <thead>
        <tr>
          <th>Poste</th>
          <th>Émissions (${resultsUnit})</th>
        </tr>
      </thead>
      <tbody>
        ${totalResults
          .map(
            (result) => `
          <tr>
            <td>${result.post}</td>
            <td>${formatPDFNumber(result.value)}</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  </div>
`

export const generateInfoSection = (infoText: string) => `
  <div class="info-section">
    <div class="info-text">
      ${infoText
        .split('\n\n')
        .map((paragraph) => `<p>${paragraph}</p>`)
        .join('')}
    </div>
  </div>
`

export const generateFooter = (referenceYear: number) => `
  <div class="footer">
    <p>Empreinte carbone simplifiée ${referenceYear} - COUNT V1.0</p>
  </div>
`

export const generateChartSection = (chartTitle: string, chartContent?: string) => `
  <div class="chart-container">
    <h3 class="chart-title">${chartTitle}</h3>
    ${chartContent || '<div class="chart-placeholder">Graphique à implémenter</div>'}
  </div>
`

export const generateCompletePDFHTML = (
  studyName: string,
  referenceYear: number,
  sites: SiteData[],
  totalResults: Array<{ post: string; value: number }>,
  resultsUnit: string,
  infoText: string,
) => `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Empreinte carbone simplifiée ${referenceYear}</title>
  <style>${loadCSS()}</style>
</head>
<body>
  ${generateHeader(studyName, referenceYear)}
  ${generateSitesList(sites)}
  ${sites.map((site) => generateSiteSection(site, resultsUnit)).join('')}
  ${generateTotalSection(totalResults, resultsUnit)}
  ${generateInfoSection(infoText)}
  ${generateFooter(referenceYear)}
</body>
</html>
`
