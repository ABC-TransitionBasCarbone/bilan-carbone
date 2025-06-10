import { useEffect } from 'react'
import styles from './FeedbackModal.module.css'

const typeformId = process.env.NEXT_PUBLIC_FEEDBACK_TYPEFORM_ID

const FeedbackModal = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//embed.typeform.com/next/embed.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return <div className={styles.form} data-tf-live={typeformId} />
}

export default FeedbackModal
