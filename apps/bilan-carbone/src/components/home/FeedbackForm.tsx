import { appendForm } from '@/utils/form'
import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import { useEffect } from 'react'

const typeformId = process.env.NEXT_PUBLIC_FEEDBACK_TYPEFORM_ID
const cutTypeformId = process.env.NEXT_PUBLIC_CUT_FEEDBACK_TYPEFORM_ID
const tiltTypeformId = process.env.NEXT_PUBLIC_TILT_FEEDBACK_TYPEFORM_ID
const clicksonTypeformId = process.env.NEXT_PUBLIC_CLICKSON_FEEDBACK_TYPEFORM_ID

interface Props {
  environment: Environment
}
const formPerEnvironmentTab: Record<Environment, string | undefined> = {
  [Environment.BC]: typeformId,
  [Environment.CUT]: cutTypeformId,
  [Environment.TILT]: tiltTypeformId,
  [Environment.CLICKSON]: clicksonTypeformId,
}

const FeedbackForm = ({ environment }: Props) => {
  'use memo'

  const formId = formPerEnvironmentTab[environment] || typeformId

  useEffect(() => {
    appendForm()
  }, [])

  return formId ? <div className="typeform" data-tf-live={formId} /> : <></>
}

export default FeedbackForm
