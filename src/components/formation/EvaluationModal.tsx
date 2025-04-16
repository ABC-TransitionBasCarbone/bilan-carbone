import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import Countdown from 'react-countdown'

interface Props {
  user: User
  organizationName: string
  onClose: () => void
  startTime: number
}

const typeformId = process.env.NEXT_PUBLIC_TYPEFORM_ID
const timer = Number(process.env.NEXT_PUBLIC_TYPEFORM_DURATION)

const EvaluationModal = ({ user, organizationName, onClose, startTime }: Props) => {
  const t = useTranslations('formation')

  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//embed.typeform.com/next/embed.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const params = {
    name: user.lastName,
    firstname: user.firstName,
    email: user.email,
    level: user.level || '',
    date: new Date().toLocaleDateString('Fr-fr'),
    organization: organizationName,
  }

  const onTimerEnd = () => {
    onClose()
  }

  return (
    <>
      <span className="text-center mb-2">
        {t('timer')}
        <Countdown date={startTime + timer} onComplete={onTimerEnd} />
      </span>
      <div
        data-tf-live={typeformId}
        data-tf-hidden={[
          `name=${params.name}`,
          `firstname=${params.firstname}`,
          `email=${params.email}`,
          `level=${params.level}`,
          `date=${params.date}`,
          `organization=${params.organization}`,
        ].join(',')}
      />
    </>
  )
}

export default EvaluationModal
