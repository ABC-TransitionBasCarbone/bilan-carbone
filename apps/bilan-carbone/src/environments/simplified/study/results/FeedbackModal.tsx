import { UserSessionProps } from "@/components/hoc/withAuth"
import { appendForm } from "@/utils/form"
import { UserSession } from "next-auth"
import { useEffect } from "react"

const typeformId = process.env.NEXT_PUBLIC_RESULTS_FEEDBACK_TYPEFORM_ID
interface Props {
  user: UserSession
  organizationName: string
}
export const FeedbackModal = ({ user, organizationName }: Props) => {
  const params = {
    name: user.lastName.toUpperCase(),
    firstname: user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1).toLowerCase(),
    email: user.email,
    organization: organizationName,
  }
  useEffect(() => {
    appendForm()
  }, [])

  return <div
    className="typeform"
    data-tf-live={typeformId}
    data-tf-hidden={[
      `name=${params.name}`,
      `firstname=${params.firstname}`,
      `email=${params.email}`,
      `organization=${params.organization}`,
    ].join(',')}
  />
}