'use client'

import Alert from '@mui/material/Alert'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  getMessageBannerDismissalTimeRemaining,
  getMessageBannerExpirationDelay,
  readMessageBannerDismissal,
  startMessageBannerRefresh,
  writeMessageBannerDismissal,
} from '../utils/messageBanner'
import styles from './MessageBanners.module.css'

interface MessageBanner {
  id: string
  message: string
  endDate: Date
}

const MessageBannerItem = ({ id, message, endDate }: MessageBanner) => {
  const storageKey = `message-banner-dismissed-${id}`
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  const [dismissalLoaded, setDismissalLoaded] = useState(false)
  const [now, setNow] = useState(Date.now)
  const expiresAt = endDate.getTime()

  useEffect(() => {
    setDismissedAt(readMessageBannerDismissal(storageKey))
    setDismissalLoaded(true)
  }, [storageKey])

  useEffect(() => {
    const delay = getMessageBannerExpirationDelay(expiresAt)
    if (delay === null) {
      if (now <= expiresAt) {
        setNow(Date.now())
      }
      return
    }
    const timeout = window.setTimeout(() => setNow(Date.now()), delay)
    return () => window.clearTimeout(timeout)
  }, [expiresAt, now])

  useEffect(() => {
    if (dismissedAt === null) {
      return
    }

    const remaining = getMessageBannerDismissalTimeRemaining(dismissedAt)
    if (remaining <= 0) {
      writeMessageBannerDismissal(storageKey, null)
      setDismissedAt(null)
      return
    }

    const timeout = window.setTimeout(() => {
      writeMessageBannerDismissal(storageKey, null)
      setDismissedAt(null)
    }, remaining)

    return () => window.clearTimeout(timeout)
  }, [dismissedAt, storageKey])

  const dismiss = () => {
    const now = Date.now()
    setDismissedAt(now)
    writeMessageBannerDismissal(storageKey, now)
  }

  if (
    !dismissalLoaded ||
    now > expiresAt ||
    (dismissedAt !== null && getMessageBannerDismissalTimeRemaining(dismissedAt) > 0)
  ) {
    return null
  }

  return (
    <Alert severity="info" onClose={dismiss} className={styles.banner}>
      <span className={styles.message}>{message}</span>
    </Alert>
  )
}

interface Props {
  banners: MessageBanner[]
}

const MessageBanners = ({ banners }: Props) => {
  const router = useRouter()

  useEffect(() => startMessageBannerRefresh(router.refresh), [router])

  const nonEmptyBanners = banners.filter((banner) => banner.message.trim().length > 0)

  if (!nonEmptyBanners.length) {
    return null
  }

  return (
    <div className="flex-col gapped1 p1">
      {nonEmptyBanners.map((banner) => (
        <MessageBannerItem key={banner.id} {...banner} />
      ))}
    </div>
  )
}

export default MessageBanners
