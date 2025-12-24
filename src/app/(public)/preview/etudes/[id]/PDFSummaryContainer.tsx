'use client'
import { FullStudy } from '@/db/study'
import PDFSummaryClickson from '@/environments/clickson/study/PDF/PDFSummary'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import PDFSummaryCut from '@/environments/cut/study/PDF/PDFSummary'
import { LocaleType } from '@/i18n/config'
import { switchEnvironment } from '@/i18n/environment'
import { switchLocale } from '@/i18n/locale'
import { Environment } from '@prisma/client'
import { useEffect, useState } from 'react'

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
      forceEnvironment={environment}
      environmentComponents={{ [Environment.CLICKSON]: <PDFSummaryClickson study={study} environment={environment} /> }}
      defaultComponent={<PDFSummaryCut study={study} environment={environment} />}
    />
  )
}

export default PDFSummaryContainer
