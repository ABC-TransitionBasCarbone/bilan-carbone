'use client'

import SelectStudySite from '@/components/study/site/SelectStudySite'
import useStudySite from '@/components/study/site/useStudySite'
import { FullStudy } from '@/db/study'
import DownloadIcon from '@mui/icons-material/Download'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import { Box, Button, Tab, Tabs, Typography } from '@mui/material'
import { useTranslations } from 'next-intl'
import { SyntheticEvent, useState } from 'react'

import ConsolidatedResultsTable from '@/components/study/results/consolidated/ConsolidatedResultsTable'
import TabPanel from '@/components/tabPanel/tabPanel'
import { EmissionFactorWithParts } from '@/db/emissionFactors'
import { downloadStudyResults } from '@/services/study'
import { Environment } from '@prisma/client'

import Block from '@/components/base/Block'
import LoadingButton from '@/components/base/LoadingButton'
import StudyCharts from '@/components/study/charts/StudyCharts'
import { useServerFunction } from '@/hooks/useServerFunction'
import { generateStudyResultsPDFPlaywright } from '@/services/serverFunctions/pdfPlaywright'
import classNames from 'classnames'
import Link from 'next/link'
import styles from './AllResults.module.css'

interface Props {
  emissionFactorsWithParts: EmissionFactorWithParts[]
  study: FullStudy
  validatedOnly: boolean
}

const a11yProps = (index: number) => {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  }
}

const AllResults = ({ emissionFactorsWithParts, study, validatedOnly }: Props) => {
  const [value, setValue] = useState(0)
  const [pdfLoading, setPdfLoading] = useState(false)
  const handleChange = (_event: SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  const tOrga = useTranslations('study.organization')
  const tPost = useTranslations('emissionFactors.post')
  const tResults = useTranslations('study.results')
  const tExport = useTranslations('exports')
  const tQuality = useTranslations('quality')
  const tBeges = useTranslations('beges')
  const tUnits = useTranslations('study.results.units')
  const tExportButton = useTranslations('study.export')
  const tStudyNav = useTranslations('study.navigation')
  const { callServerFunction } = useServerFunction()

  const { studySite, setSite } = useStudySite(study, true)

  const handlePDFDownload = async () => {
    setPdfLoading(true)
    await callServerFunction(() => generateStudyResultsPDFPlaywright(study.id), {
      onSuccess: (data) => {
        // Créer un blob à partir du buffer
        const pdfBuffer = new Uint8Array(data.pdfBuffer)
        const pdfBlob = new Blob([pdfBuffer], { type: data.contentType })

        // Télécharger le PDF
        const url = URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = data.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      },
      onError: () => {
        // L'erreur est déjà gérée par callServerFunction avec un toast
      },
    })
    setPdfLoading(false)
  }

  return (
    <Block title={study.name} as="h1" description={tStudyNav('results')} bold descriptionColor="primary">
      <Box component="section" className="mb2">
        <Typography>
          {tResults.rich('cutFeedback', {
            lien: (children) => (
              <Link href={process.env.NEXT_PUBLIC_CUT_FEEDBACK_TYPEFORM_LINK ?? ''} target="_blank">
                <strong>{children}</strong>
              </Link>
            ),
          })}
        </Typography>
      </Box>
      <Box component="section" className={classNames(styles.gapped, 'flex')}>
        <div className={classNames(styles.gapped, 'flex flex-col')}>
          <SelectStudySite study={study} allowAll studySite={studySite} setSite={setSite} />
          <Button
            variant="contained"
            color="primary"
            size="large"
            endIcon={<DownloadIcon />}
            onClick={() =>
              downloadStudyResults(
                study,
                [],
                emissionFactorsWithParts,
                tResults,
                tExport,
                tPost,
                tOrga,
                tQuality,
                tBeges,
                tUnits,
                Environment.CUT,
              )
            }
          >
            {tExportButton('export')}
          </Button>
          <LoadingButton
            variant="outlined"
            color="primary"
            size="large"
            endIcon={<PictureAsPdfIcon />}
            onClick={handlePDFDownload}
            loading={pdfLoading}
          >
            {tResults('downloadPDF')}
          </LoadingButton>
        </div>
        <Typography className={classNames(styles.infoContainer, 'ml2')}>{tResults('info')}</Typography>
      </Box>
      <Box component="section" sx={{ marginTop: '1rem' }}>
        <Tabs value={value} onChange={handleChange} indicatorColor="secondary" textColor="inherit" variant="fullWidth">
          <Tab label="Tableau" {...a11yProps(0)} />
          <Tab label="Diagramme en barres" {...a11yProps(1)} />
          <Tab label="Diagramme circulaire" {...a11yProps(2)} />
        </Tabs>
        <Box component="section" sx={{ marginTop: '1rem' }}>
          <TabPanel value={value} index={0}>
            <ConsolidatedResultsTable study={study} studySite={studySite} withDependencies={false} hiddenUncertainty />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <StudyCharts
              study={study}
              studySite={studySite}
              type="bar"
              height={450}
              showTitle={false}
              showLegend={true}
              showLabelsOnBars={true}
              validatedOnly={validatedOnly}
            />
          </TabPanel>
          <TabPanel value={value} index={2}>
            <StudyCharts
              study={study}
              studySite={studySite}
              type="pie"
              height={350}
              showTitle={false}
              showLegend={true}
              showLabelsOnPie={true}
              validatedOnly={validatedOnly}
            />
          </TabPanel>
        </Box>
      </Box>
    </Block>
  )
}

export default AllResults
