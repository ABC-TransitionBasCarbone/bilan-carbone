import { getStudyById } from "@/db/study"

export const getStudyParentOrganizationVersionId = async (
  studyId: string,
  userOrganizationVersionId: string | null,
) => {
  const study = await getStudyById(studyId, userOrganizationVersionId)
  if (!study) {
    throw Error("Study doesn't exist")
  }

  return study.organizationVersion.parentId || study.organizationVersion.id
}

