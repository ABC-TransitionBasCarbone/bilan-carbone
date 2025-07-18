import { FullStudy } from '@/db/study'
import { ResultsByPost } from '@/services/results/consolidated'
import { formatNumber } from '@/utils/number'
import { STUDY_UNIT_VALUES } from '@/utils/study'
import { Theme } from '@mui/material/styles'
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import path from 'path'
import React from 'react'

interface StudyResultsPDFProps {
  study: FullStudy
  computedResults: ResultsByPost[]
  cinemaName: string
  cinemaCity: string
  referenceYear: number
  generalData: {
    screens: number
    entries: number
    sessions: number
    movies: number
  }
  theme: Theme
  chartImages?: {
    barChart?: string
    pieChart?: string
  }
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      backgroundColor: theme.palette.background.default,
      paddingTop: 80, // Space for header
      paddingBottom: 80, // Space for footer
      paddingHorizontal: 35,
      fontFamily: 'Helvetica',
    },
    header: {
      position: 'absolute',
      top: 20,
      left: 35,
      right: 35,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 10,
      borderBottom: `2px solid ${theme.palette.primary.main}`,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cutLogo: {
      width: 80,
      height: 50,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.palette.primary.contrastText,
      marginBottom: 10,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      color: theme.palette.grey[500],
      marginBottom: 20,
      textAlign: 'center',
    },
    cinemaInfo: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.palette.text.primary,
      marginBottom: 10,
      textAlign: 'center',
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.palette.primary.contrastText,
      marginBottom: 10,
      paddingBottom: 5,
      borderBottom: `1px solid ${theme.palette.primary.light}`,
    },
    generalDataContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: theme.palette.primary.light,
      padding: 15,
      borderRadius: 8,
      marginBottom: 15,
    },
    generalDataItem: {
      flex: 1,
      alignItems: 'center',
    },
    generalDataLabel: {
      fontSize: 12,
      color: theme.palette.grey[500],
      marginBottom: 5,
    },
    generalDataValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.palette.text.primary,
    },
    resultsTable: {
      width: '100%',
      borderCollapse: 'collapse',
      marginBottom: 15,
    },
    tableHeader: {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.text.primary,
      padding: 8,
      fontSize: 12,
      fontWeight: 'bold',
      borderBottom: `1px solid ${theme.palette.primary.light}`,
    },
    tableRow: {
      borderBottom: `1px solid ${theme.palette.primary.light}`,
    },
    tableCell: {
      padding: 8,
      fontSize: 11,
      color: theme.palette.text.primary,
    },
    tableCellNumber: {
      padding: 8,
      fontSize: 11,
      color: theme.palette.text.primary,
      textAlign: 'right',
    },
    totalRow: {
      backgroundColor: theme.palette.primary.light,
      fontWeight: 'bold',
    },
    chartSection: {
      marginBottom: 20,
    },
    chartTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.palette.primary.contrastText,
      marginBottom: 10,
    },
    chartImage: {
      width: '100%',
      height: 250,
      objectFit: 'contain',
    },
    chartDebugText: {
      fontSize: 10,
      color: theme.palette.error.main,
      marginBottom: 10,
    },
    closingText: {
      fontSize: 11,
      color: theme.palette.text.primary,
      lineHeight: 1.5,
      marginBottom: 15,
      textAlign: 'justify',
    },
    bulletPoint: {
      fontSize: 11,
      color: theme.palette.text.primary,
      marginBottom: 5,
      paddingLeft: 15,
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 35,
      right: 35,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: `1px solid ${theme.palette.primary.main}`,
      paddingTop: 15,
    },
    footerLogos: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    footerLogo: {
      width: 60,
      height: 40,
      marginRight: 15,
    },
    pageNumber: {
      fontSize: 10,
      color: theme.palette.grey[500],
    },
  })

// Custom number formatter for PDF (spaces instead of slashes)
const formatPDFNumber = (value: number) => {
  return formatNumber(value).replace(/\s/g, ' ')
}

// Header component
const PDFHeader: React.FC<{ styles: ReturnType<typeof createStyles> }> = ({ styles }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Image style={styles.cutLogo} src={path.join(process.cwd(), 'public', 'logos', 'cut', 'CUT.svg')} />
    </View>
  </View>
)

// Footer component
const PDFFooter: React.FC<{ styles: ReturnType<typeof createStyles>; pageNumber: number }> = ({
  styles,
  pageNumber,
}) => (
  <View style={styles.footer}>
    <View style={styles.footerLogos}>
      <Image style={styles.footerLogo} src={path.join(process.cwd(), 'public', 'logos', 'cut', 'ABC.svg')} />
      <Image style={styles.footerLogo} src={path.join(process.cwd(), 'public', 'logos', 'cut', 'CNC.svg')} />
      <Image style={styles.footerLogo} src={path.join(process.cwd(), 'public', 'logos', 'cut', 'france_2030.png')} />
    </View>
    <Text style={styles.pageNumber}>Page {pageNumber}</Text>
  </View>
)

const StudyResultsPDF: React.FC<StudyResultsPDFProps> = ({
  study,
  computedResults,
  cinemaName,
  cinemaCity,
  referenceYear,
  generalData,
  theme,
  chartImages,
}) => {
  const styles = createStyles(theme)

  const totalResult = computedResults.find((result) => result.post === 'total')
  const totalValue = totalResult ? totalResult.value / STUDY_UNIT_VALUES[study.resultsUnit] : 0
  const formattedTotal = formatPDFNumber(totalValue)

  // Include all results, even those with value 0
  const allResults = computedResults.filter((result) => result.post !== 'total')

  // Debug chart images
  console.log('Chart images in PDF:', {
    barChart: chartImages?.barChart ? 'Present' : 'Missing',
    pieChart: chartImages?.pieChart ? 'Present' : 'Missing',
  })

  return (
    <Document>
      {/* Page 1: Results and Data */}
      <Page size="A4" style={styles.page}>
        <PDFHeader styles={styles} />

        {/* Title Section */}
        <View style={styles.section}>
          <Text style={styles.title}>Bilan d'impact écologique</Text>
          <Text style={styles.subtitle}>COUNT V1.0 Estimation d'impact carbone</Text>
          <Text style={styles.cinemaInfo}>
            {cinemaName.toUpperCase()} – {cinemaCity.toUpperCase()}
          </Text>
          <Text style={styles.cinemaInfo}>{referenceYear}</Text>
        </View>

        {/* General Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Données générales</Text>
          <View style={styles.generalDataContainer}>
            <View style={styles.generalDataItem}>
              <Text style={styles.generalDataLabel}>Nb d'écrans</Text>
              <Text style={styles.generalDataValue}>{generalData.screens}</Text>
            </View>
            <View style={styles.generalDataItem}>
              <Text style={styles.generalDataLabel}>Nb d'entrées</Text>
              <Text style={styles.generalDataValue}>{formatPDFNumber(generalData.entries)}</Text>
            </View>
            <View style={styles.generalDataItem}>
              <Text style={styles.generalDataLabel}>Nb de séances</Text>
              <Text style={styles.generalDataValue}>{formatPDFNumber(generalData.sessions)}</Text>
            </View>
            <View style={styles.generalDataItem}>
              <Text style={styles.generalDataLabel}>Nb de films</Text>
              <Text style={styles.generalDataValue}>{generalData.movies}</Text>
            </View>
          </View>
        </View>

        {/* Results Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultats du bilan carbone</Text>

          {/* Table Header */}
          <View style={[styles.tableRow, { flexDirection: 'row' }]}>
            <View style={[styles.tableHeader, { flex: 2 }]}>
              <Text>Poste</Text>
            </View>
            <View style={[styles.tableHeader, { flex: 1 }]}>
              <Text>Valeur ({study.resultsUnit})</Text>
            </View>
          </View>

          {/* Table Rows */}
          {allResults.map((result, index) => (
            <View key={index} style={[styles.tableRow, { flexDirection: 'row' }]}>
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text>{result.post}</Text>
              </View>
              <View style={[styles.tableCellNumber, { flex: 1 }]}>
                <Text>{formatPDFNumber(result.value / STUDY_UNIT_VALUES[study.resultsUnit])}</Text>
              </View>
            </View>
          ))}

          {/* Total Row */}
          <View style={[styles.tableRow, styles.totalRow, { flexDirection: 'row' }]}>
            <View style={[styles.tableCell, { flex: 2 }]}>
              <Text style={{ fontWeight: 'bold' }}>Total</Text>
            </View>
            <View style={[styles.tableCellNumber, { flex: 1 }]}>
              <Text style={{ fontWeight: 'bold' }}>{formattedTotal}</Text>
            </View>
          </View>
        </View>

        <PDFFooter styles={styles} pageNumber={1} />
      </Page>

      {/* Page 2: Charts */}
      {chartImages && (chartImages.barChart || chartImages.pieChart) && (
        <Page size="A4" style={styles.page}>
          <PDFHeader styles={styles} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Graphiques</Text>

            {/* Debug information */}
            <Text style={styles.chartDebugText}>
              Debug: Bar chart {chartImages.barChart ? 'available' : 'missing'}, Pie chart{' '}
              {chartImages.pieChart ? 'available' : 'missing'}
            </Text>

            {chartImages.barChart && (
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>Diagramme en barres</Text>
                <Image style={styles.chartImage} src={chartImages.barChart} />
              </View>
            )}

            {chartImages.pieChart && (
              <View style={styles.chartSection}>
                <Text style={styles.chartTitle}>Diagramme circulaire</Text>
                <Image style={styles.chartImage} src={chartImages.pieChart} />
              </View>
            )}
          </View>

          <PDFFooter styles={styles} pageNumber={2} />
        </Page>
      )}

      {/* Page 3: Explanatory Text */}
      <Page size="A4" style={styles.page}>
        <PDFHeader styles={styles} />

        {/* Closing Text */}
        <View style={styles.section}>
          <Text style={styles.closingText}>
            Le Bilan Carbone mesure les émissions de gaz à effet de serre d'une activité, et par conséquent sa
            contribution au dérèglement climatique ainsi que sa dépendance aux énergies fossiles et donc sa
            vulnérabilité.
          </Text>
          <Text style={styles.closingText}>
            L'Union Européenne s'est engagée, en ratifiant l'Accord de Paris, à la neutralité carbone d'ici 2050. Pour
            contribuer à cet objectif, votre cinéma devrait réduire son impact de 5% par an.
          </Text>
          <Text style={styles.closingText}>
            Nous vous invitons donc à refaire ce bilan l'année prochaine pour vérifier que vous êtes sur la bonne
            trajectoire !
          </Text>
        </View>

        {/* Call to Action */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pour aller plus loin, vous pouvez :</Text>
          <Text style={styles.bulletPoint}>
            • Vous former : il existe une formation gratuite dédiée aux enjeux de la salle de cinéma proposée par le
            CNC.
          </Text>
          <Text style={styles.bulletPoint}>
            • Explorer l'ensemble des outils existants sur le site de CUT ! Cinéma Uni pour la Transition.
          </Text>
          <Text style={styles.bulletPoint}>• Construire votre plan d'actions sur le site dédié de la FNCF.</Text>
        </View>

        <PDFFooter styles={styles} pageNumber={chartImages && (chartImages.barChart || chartImages.pieChart) ? 3 : 2} />
      </Page>
    </Document>
  )
}

export default StudyResultsPDF
