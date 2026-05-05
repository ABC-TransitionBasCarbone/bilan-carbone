'use client'
import type { FullStudy } from '@/db/study'
import DynamicComponent from '@/environments/core/utils/DynamicComponent'
import { LocaleType } from '@/i18n/config'
import { getMessages } from '@/i18n/utils'
import { Environment } from '@repo/db-common/enums'
import { NextIntlClientProvider } from 'next-intl'
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
  const [messages, setMessages] = useState<{ locale: LocaleType; messages: object } | null>(null)

  useEffect(() => {
    const setMessagesLocaleEnvironment = async () => {
      const messages = await getMessages(locale, environment)
      setMessages(messages)
    }
    setMessagesLocaleEnvironment()
  }, [environment, locale])

  if (!messages) {
    return null
  }

  return (
    <NextIntlClientProvider locale={messages.locale} messages={messages.messages}>
      <DynamicComponent
        forceEnvironment={environment}
        environmentComponents={{ [Environment.CLICKSON]: <PDFSummaryClickson study={study} /> }}
        defaultComponent={<PDFSummaryCut study={study} />}
      />
    </NextIntlClientProvider>
  )
}

export default PDFSummaryContainer
