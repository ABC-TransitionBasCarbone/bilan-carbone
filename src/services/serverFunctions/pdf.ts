'use server'

import { dbActualizedAuth } from '@/services/auth'
import { withServerResponse } from '@/utils/serverResponse'
import axios, { isAxiosError } from 'axios'
import jwt from 'jsonwebtoken'
import { getLocale } from 'next-intl/server'
import { NOT_AUTHORIZED, SERVER_ERROR } from '../permissions/check'

export const generateStudySummaryPDF = async (studyId: string, studyName: string, referenceYear: number) =>
  withServerResponse('generateStudySummaryPDF', async () => {
    const session = await dbActualizedAuth()
    if (!session?.user) {
      throw new Error(NOT_AUTHORIZED)
    }

    const API_URL = process.env.PDF_SERVICE_URL
    const API_SECRET = process.env.PDF_SERVICE_API_SECRET
    const JWT_KEY = process.env.PDF_JWT_SECRET

    if (!API_URL || !API_SECRET || !JWT_KEY) {
      console.error('PDF service URL, API secret, or JWT key not set')
      throw new Error(SERVER_ERROR)
    }

    const locale = await getLocale()

    try {
      const token = jwt.sign(
        {
          userId: session.user.id,
          studyId: studyId,
          organizationVersionId: session.user.organizationVersionId,
          environment: session.user.environment,
          exp: Math.floor(Date.now() / 1000) + 1 * 60, // 1 minute
          locale,
        },
        JWT_KEY,
      )

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const pdfUrl = `${baseUrl}/preview/etudes/${studyId}?t=${token}`

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '2cm',
          bottom: '2cm',
          left: '1.5cm',
          right: '1.5cm',
        },
      }

      const response = await axios.post(
        `${API_URL}/generate-pdf`,
        {
          url: pdfUrl,
          pdfOptions,
        },
        {
          headers: {
            'x-api-key': API_SECRET,
          },
          responseType: 'arraybuffer',
        },
      )

      const pdfBuffer = response.data
      const filename = `${studyName}_empreinte_carbone_${referenceYear}.pdf`

      return {
        pdfBuffer: Array.from(new Uint8Array(pdfBuffer)),
        filename,
        contentType: 'application/pdf',
      }
    } catch (error) {
      let errorMessage = 'Unknown error'
      if (isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message || 'Axios request failed'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      console.error('PDF generation failed:', errorMessage)
      throw new Error(`PDF generation failed: ${errorMessage}`)
    }
  })
