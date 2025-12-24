import NotFound from '@/components/pages/NotFound'
import { FullStudy, getStudyById } from '@/db/study'
import { getUserById } from '@/db/user'
import { LocaleType } from '@/i18n/config'
import { Environment } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { headers } from 'next/headers'
import React from 'react'

export type PdfAuthProps = {
  study: FullStudy
  environment: Environment
  locale: LocaleType
}

interface Props {
  params: Promise<{
    id: string
  }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withPdfAuth = (WrappedComponent: React.ComponentType<any & PdfAuthProps>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = async (props: any & Props) => {
    const params = await props.params
    const studyId = params.id

    if (!studyId) {
      console.error('studyId not found')
      return <NotFound />
    }

    let study: FullStudy | null = null
    let environment: Environment | null = null
    let locale: LocaleType | null = null

    // Only use PDF JWT authentication
    const headersList = await headers()
    const url = headersList.get('x-url')

    let pdfToken: string | null = null
    if (url) {
      try {
        const urlObj = new URL(url)
        pdfToken = urlObj.searchParams.get('t')
      } catch (error) {
        console.error('Invalid URL in x-url header:', error)
      }
    }

    if (pdfToken) {
      try {
        const payload = jwt.verify(pdfToken, process.env.PDF_JWT_SECRET!) as {
          userId: string
          studyId: string
          organizationVersionId: string
          environment: string
          locale: string
        }

        // Verify token was issued for THIS specific study
        if (payload.studyId === studyId) {
          // Get user and verify they still have access
          const pdfUser = await getUserById(payload.userId)
          if (pdfUser) {
            // Use the organizationVersionId from the token for proper context
            study = await getStudyById(studyId, payload.organizationVersionId)
            environment = payload.environment as Environment
            locale = payload.locale as LocaleType
          }
        }
      } catch (error) {
        console.error('PDF auth failed:', error)
      }
    }

    if (!study) {
      return <NotFound />
    }

    return <WrappedComponent {...props} study={study} environment={environment} locale={locale} />
  }

  Component.displayName = 'WithPdfAuth'
  return Component
}

export default withPdfAuth
