import classNames from 'classnames'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { User } from 'next-auth'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import Countdown from 'react-countdown'

dayjs.extend(utc)

interface Props {
  user: User
  organizationName: string
  startTime: number
}

const typeformId = process.env.NEXT_PUBLIC_TYPEFORM_ID
const timer = Number(process.env.NEXT_PUBLIC_TYPEFORM_DURATION)

const EvaluationModal = ({ user, organizationName, startTime }: Props) => {
  const t = useTranslations('formation')
  const [isEnding, setIsEnding] = useState(false)

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
    date: dayjs(startTime).toISOString(),
    organization: organizationName,
  }

  const displayWarning = () => {
    setIsEnding(true)
    window.alert(t('alertMessage'))
  }

  return (
    <>
      <span className={classNames('text-center mb-2', { error: isEnding })}>
        {t('timer')}
        <Countdown onTick={(e) => e.minutes < 5 && !isEnding && displayWarning()} date={startTime + timer} />
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
