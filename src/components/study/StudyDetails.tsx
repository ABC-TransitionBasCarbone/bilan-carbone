import { Study } from '@prisma/client'

interface Props {
  study: Study
}

const StudyDetails = ({ study }: Props) => {
  return (
    <>
      <h1>{study.name}</h1>
    </>
  )
}

export default StudyDetails
