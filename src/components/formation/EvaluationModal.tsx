import { User } from 'next-auth'
import { useEffect } from 'react'

interface Props {
  user: User
  organisationName: string
}

const typeformId = process.env.NEXT_PUBLIC_TYPEFORM_ID

const EvaluationModal = ({ user, organisationName }: Props) => {
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
    organisation: organisationName,
  }

  return (
    <div
      data-tf-live={typeformId}
      data-tf-hidden={[
        `name=${params.name}`,
        `firstname=${params.firstname}`,
        `email=${params.email}`,
        `level=${params.level}`,
        `date=${params.date}`,
        `organisation=${params.organisation}`,
      ].join(',')}
    />
  )
}

export default EvaluationModal
