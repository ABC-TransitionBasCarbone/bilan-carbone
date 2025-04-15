import { User } from 'next-auth'
import { useEffect } from 'react'

interface Props {
  user: User
}

const typeformId = process.env.NEXT_PUBLIC_TYPEFORM_ID

const EvaluationModal = ({ user }: Props) => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = '//embed.typeform.com/next/embed.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const params = new URLSearchParams({ name: user.lastName, firstname: user.firstName, email: user.email })

  return (
    <div
      data-tf-live={typeformId}
      data-tf-hidden={['name', 'firstname', 'email'].join(',')}
      data-tf-params={params.toString()}
    />
  )
}

export default EvaluationModal
