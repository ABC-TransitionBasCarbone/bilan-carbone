'use client'

import Alert from '@mui/material/Alert'
import { useEffect, useState } from 'react'
import { getMessageBannerDismissalTimeRemaining } from '../utils/messageBanner'
import styles from './MessageBanners.module.css'

interface MessageBanner {
  id: string
  message: string
}

const MessageBannerItem = ({ id, message }: MessageBanner) => {
  const storageKey = `message-banner-dismissed-${id}`
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)
  const [dismissalLoaded, setDismissalLoaded] = useState(false)

  useEffect(() => {
    const storedDismissal = Number(window.localStorage.getItem(storageKey))
    if (Number.isFinite(storedDismissal) && storedDismissal > 0) {
      setDismissedAt(storedDismissal)
    }
    setDismissalLoaded(true)
  }, [storageKey])

  useEffect(() => {
    if (dismissedAt === null) {
      return
    }

    const remaining = getMessageBannerDismissalTimeRemaining(dismissedAt)
    if (remaining <= 0) {
      window.localStorage.removeItem(storageKey)
      setDismissedAt(null)
      return
    }

    const timeout = window.setTimeout(() => {
      window.localStorage.removeItem(storageKey)
      setDismissedAt(null)
    }, remaining)

    return () => window.clearTimeout(timeout)
  }, [dismissedAt, storageKey])

  const dismiss = () => {
    const now = Date.now()
    window.localStorage.setItem(storageKey, now.toString())
    setDismissedAt(now)
  }

  if (!dismissalLoaded || (dismissedAt !== null && getMessageBannerDismissalTimeRemaining(dismissedAt) > 0)) {
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
  if (!banners.length) {
    return null
  }

  return (
    <div className="flex-col gapped1 p1">
      {banners.map((banner) => (
        <MessageBannerItem key={banner.id} {...banner} />
      ))}
    </div>
  )
}

export default MessageBanners
