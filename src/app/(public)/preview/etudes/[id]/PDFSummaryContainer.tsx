'use client'

import { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { typeDynamicComponent } from '@/environments/core/utils/dynamicUtils'
import { LocaleType } from '@/i18n/config'
import { switchEnvironment } from '@/i18n/environment'
import { switchLocale } from '@/i18n/locale'
import { Environment } from '@prisma/client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const PDFSummaryClickson = dynamic(() => import('@/environments/clickson/study/PDF/PDFSummary'))
const PDFSummaryCut = dynamic(() => import('@/environments/cut/study/PDF/PDFSummary'))

interface Props {
  study: FullStudy
  environment: Environment
  locale: LocaleType
}

const PDFSummaryContainer = ({ study, environment, locale }: Props) => {
  const [canRender, setCanRender] = useState(false)

  useEffect(() => {
    const setTranslationCookies = async () => {
      await switchLocale(locale)
      await switchEnvironment(environment)
      setCanRender(true)
    }
    setTranslationCookies()
  }, [environment, locale])

  if (!canRender) {
    return null
  }
  return (
    <DynamicComponent
      environment={environment}
      environmentComponents={{
        [Environment.CLICKSON]: typeDynamicComponent({ component: PDFSummaryClickson, props: { study } }),
      }}
      defaultComponent={typeDynamicComponent({ component: PDFSummaryCut, props: { study, environment } })}
    />
  )
}

export default PDFSummaryContainer
