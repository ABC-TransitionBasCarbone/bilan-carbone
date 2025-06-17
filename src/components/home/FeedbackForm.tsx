import { appendForm } from '@/utils/form'
import { Environment } from '@prisma/client'
import { useEffect, useState } from 'react'

const typeformId = process.env.NEXT_PUBLIC_FEEDBACK_TYPEFORM_ID
const cutTypeformId = process.env.NEXT_PUBLIC_CUT_FEEDBACK_TYPEFORM_ID

interface Props {
  environment: Environment
}

const FeedbackForm = ({ environment }: Props) => {
  const [formId, setFormId] = useState<string | undefined>(undefined)

  useEffect(() => {
    appendForm()
  }, [])

  const formPerEnvironmentTab: Partial<Record<Environment, string | undefined>> = {
    [Environment.CUT]: cutTypeformId,
  }

  useEffect(() => {
    if (environment) {
      setFormId(formPerEnvironmentTab[environment] || typeformId)
    }
  }, [environment])

  return formId ? <div className="typeform" data-tf-live={formId} /> : <></>
}

export default FeedbackForm
