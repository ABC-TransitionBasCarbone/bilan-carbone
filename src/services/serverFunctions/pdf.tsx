'use server'

import StudyResultsPDF from '@/components/pdf/StudyResultsPDF'
import { getCNCById } from '@/db/cnc'
import { getOrganizationVersionById } from '@/db/organization'
import { getStudyById } from '@/db/study'
import cutTheme from '@/environments/cut/theme/theme'
import { dbActualizedAuth } from '@/services/auth'
import { CutPost } from '@/services/posts'
import { computeResultsByPost } from '@/services/results/consolidated'
import { mapResultsByPost } from '@/services/results/utils'
import { withServerResponse } from '@/utils/serverResponse'
import { renderToBuffer } from '@react-pdf/renderer'
import { getTranslations } from 'next-intl/server'

export const generateStudyResultsPDF = async (
  studyId: string,
  chartImages?: { barChart?: string; pieChart?: string },
) =>
  withServerResponse('generateStudyResultsPDF', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      throw new Error('Not authorized')
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    if (!study) {
      throw new Error('Study not found')
    }

    const organization = await getOrganizationVersionById(study.organizationVersionId)
    if (!organization) {
      throw new Error('Organization not found')
    }

    const tPost = await getTranslations('emissionFactors.post')
    const allComputedResults = computeResultsByPost(study, tPost, 'all', true, false, CutPost)
    const computedResults = mapResultsByPost(allComputedResults, true)

    // Extract cinema data from study sites and CNC data
    const firstSite = study.sites[0]
    let cinemaName = firstSite?.site?.name || ''
    let cinemaCity = firstSite?.site?.city || ''
    let screens = 0

    // If name or city are empty, try to get them from CNC data
    if (firstSite?.site && (!cinemaName || !cinemaCity)) {
      // Find the organization site that matches the study site
      const orgSite = organization.organization.sites.find((site) => site.id === firstSite.site.id)
      if (orgSite?.cncId) {
        try {
          const cncData = await getCNCById(orgSite.cncId)
          if (cncData) {
            // Use CNC data for missing information
            if (!cinemaName && cncData.nom) {
              cinemaName = cncData.nom
            }
            if (!cinemaCity && cncData.commune) {
              cinemaCity = cncData.commune
            }
            screens = cncData.ecrans || 0
          }
        } catch (error) {
          console.error('Error fetching CNC data:', error)
        }
      }
    } else if (firstSite?.site) {
      // Still need to get screen count from CNC even if name/city are available
      const orgSite = organization.organization.sites.find((site) => site.id === firstSite.site.id)
      if (orgSite?.cncId) {
        try {
          const cncData = await getCNCById(orgSite.cncId)
          screens = cncData?.ecrans || 0
        } catch (error) {
          console.error('Error fetching CNC data:', error)
        }
      }
    }

    // Fallback to organization data only if still empty after CNC lookup
    if (!cinemaName) {
      cinemaName = organization.organization.name || 'Cinema'
    }
    if (!cinemaCity) {
      cinemaCity = organization.organization.sites[0]?.city || 'Ville'
    }

    // Calculate general data from study sites
    const generalData = {
      screens,
      entries: study.sites.reduce((total, site) => total + (site.numberOfTickets || 0), 0),
      sessions: study.sites.reduce((total, site) => total + (site.numberOfSessions || 0), 0),
      movies: 0, // This would need to be calculated from actual data if available
    }

    const referenceYear = study.startDate.getFullYear() || new Date().getFullYear()

    const pdfBuffer = await renderToBuffer(
      <StudyResultsPDF
        study={study}
        computedResults={computedResults}
        cinemaName={cinemaName}
        cinemaCity={cinemaCity}
        referenceYear={referenceYear}
        generalData={generalData}
        theme={cutTheme}
        chartImages={chartImages}
      />,
    )

    const filename = `${study.name}_bilan_carbone_${referenceYear}.pdf`

    return {
      pdfBuffer: Array.from(pdfBuffer),
      filename,
      contentType: 'application/pdf',
    }
  })
