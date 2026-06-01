import { OTHER_TAG_ID } from '@/constants/tag.constants'

type TagFamily = { name: string; tags: { id: string }[] }

export const getAllTagIds = (tagFamilies: TagFamily[]): string[] => {
  const ids = tagFamilies.flatMap((f) => f.tags.map((tag) => tag.id))
  return tagFamilies.some((f) => f.tags.length > 0) ? [...ids, OTHER_TAG_ID] : ids
}
