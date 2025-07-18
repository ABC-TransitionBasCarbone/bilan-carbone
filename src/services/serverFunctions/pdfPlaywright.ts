'use server'

import { getStudyById } from '@/db/study'
import { dbActualizedAuth } from '@/services/auth'
import { withServerResponse } from '@/utils/serverResponse'
import { readFileSync } from 'fs'
import { join } from 'path'
import { chromium } from 'playwright'

// Fonction pour encoder un logo en base64
const encodeLogoToBase64 = (logoPath: string): string => {
  try {
    const fullPath = join(process.cwd(), 'public', logoPath)
    const imageBuffer = readFileSync(fullPath)
    const base64 = imageBuffer.toString('base64')
    const mimeType = logoPath.endsWith('.png') ? 'image/png' : 'image/svg+xml'
    return `data:${mimeType};base64,${base64}`
  } catch (error) {
    console.warn(`Could not encode logo ${logoPath}:`, error)
    return ''
  }
}

export const generateStudyResultsPDFPlaywright = async (studyId: string) =>
  withServerResponse('generateStudyResultsPDFPlaywright', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      throw new Error('Not authorized')
    }

    const study = await getStudyById(studyId, session.user.organizationVersionId)
    if (!study) {
      throw new Error('Study not found')
    }

    const referenceYear = study.startDate.getFullYear() || new Date().getFullYear()

    // Encoder les logos en base64
    const countLogo = encodeLogoToBase64('logos/cut/COUNT.png')
    const cutLogo = encodeLogoToBase64('logos/cut/CUT.png')
    const cncLogo = encodeLogoToBase64('logos/cut/CNC.png')
    const franceLogo = encodeLogoToBase64('logos/cut/France3_2025.png')

    let browser
    try {
      // Generate PDF with Playwright by navigating to the React page
      browser = await chromium.launch({
        headless: true,
        timeout: 60000, // 60 secondes timeout
      })
      const page = await browser.newPage()

      // Augmenter les timeouts
      page.setDefaultTimeout(60000)
      page.setDefaultNavigationTimeout(60000)

      // Récupérer les cookies de session pour l'authentification
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()

      // Ajouter les cookies de session à Playwright
      const sessionCookies = []
      const allCookies = cookieStore.getAll()
      for (const cookie of allCookies) {
        sessionCookies.push({
          name: cookie.name,
          value: cookie.value,
          domain: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3001').hostname,
          path: '/',
        })
      }

      if (sessionCookies.length > 0) {
        await page.context().addCookies(sessionCookies)
      }

      // Navigate to the PDF preview page
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
      const pdfUrl = `${baseUrl}/preview/etudes/${studyId}?print=true`

      console.log('Navigating to:', pdfUrl)
      await page.goto(pdfUrl, { waitUntil: 'networkidle', timeout: 60000 })

      // Wait for charts to render
      console.log('Waiting for content to render...')
      await page.waitForTimeout(5000)

      // Vérifier que la page est bien chargée
      const content = await page.content()
      if (!content.includes('pdf-container')) {
        throw new Error('PDF content not properly loaded')
      }

      console.log('Generating PDF...')
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        displayHeaderFooter: false, // Temporairement désactivé pour diagnostiquer
        margin: {
          top: '2cm',
          bottom: '2cm',
          left: '1.5cm',
          right: '1.5cm',
        },
      })

      console.log('PDF generated successfully, size:', pdfBuffer.length)

      const filename = `${study.name}_empreinte_carbone_${referenceYear}.pdf`

      return {
        pdfBuffer: Array.from(pdfBuffer),
        filename,
        contentType: 'application/pdf',
      }
    } catch (error) {
      console.error('Error in PDF generation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`PDF generation failed: ${errorMessage}`)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  })
