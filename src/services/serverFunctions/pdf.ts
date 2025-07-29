'use server'

import { dbActualizedAuth } from '@/services/auth'
import { withServerResponse } from '@/utils/serverResponse'
import { chromium } from 'playwright'

export const generateStudySummaryPDF = async (studyId: string, studyName: string, referenceYear: number) =>
  withServerResponse('generateStudySummaryPDF', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      throw new Error('Not authorized')
    }

    let browser
    try {
      browser = await chromium.launch({
        headless: true,
        timeout: 30000,
      })
      const page = await browser.newPage()

      page.setDefaultTimeout(30000)
      page.setDefaultNavigationTimeout(30000)

      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()

      const sessionCookies = []
      const allCookies = cookieStore.getAll()
      for (const cookie of allCookies) {
        sessionCookies.push({
          name: cookie.name,
          value: cookie.value,
          domain: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000').hostname,
          path: '/',
        })
      }

      if (sessionCookies.length > 0) {
        await page.context().addCookies(sessionCookies)
      }

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const pdfUrl = `${baseUrl}/preview/etudes/${studyId}`

      await page.goto(pdfUrl, { waitUntil: 'networkidle', timeout: 30000 })

      const content = await page.content()
      if (!content.includes('pdf-container')) {
        throw new Error('PDF content not properly loaded')
      }

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          bottom: '2cm',
          left: '1.5cm',
          right: '1.5cm',
        },
      })

      const filename = `${studyName}_empreinte_carbone_${referenceYear}.pdf`

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
