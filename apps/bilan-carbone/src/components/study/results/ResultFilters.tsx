import { FullStudy } from '@/db/study'
import { environmentSubPostsMapping, Post, subPostsByPost } from '@/services/posts'
import { ResultType } from '@/services/study'
import { SubPost } from  '@repo/db-common/enums'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PostSubPostFilter } from '../../form/PostSubPostFilter'
import { TagFilter } from '../../form/TagFilter'

interface Props {
  study: Pick<FullStudy, 'tagFamilies' | 'organizationVersion'>
  selectedPostIds: string[]
  selectedTagIds: string[]
  onPostFilterChange: (ids: string[]) => void
  onTagFilterChange: (ids: string[]) => void
  exportType: ResultType
}

const ResultFilters = ({
  study,
  selectedPostIds,
  selectedTagIds,
  onPostFilterChange,
  onTagFilterChange,
  exportType,
}: Props) => {
  const [previousExportType, setPreviousExportType] = useState<string | null>(null)
  const hasInitializedRef = useRef(false)

  const tagItems = useMemo(() => {
    return study.tagFamilies.reduce(
      (acc, tagFamily) => {
        const tagInfos = tagFamily.tags.map((tag) => ({ id: tag.id, label: tag.name }))

        if (tagInfos.length > 0) {
          acc[tagFamily.id] = {
            id: tagFamily.id,
            name: tagFamily.name,
            children: tagInfos,
          }
        }

        return acc
      },
      {} as Record<string, { id: string; name: string; children: { id: string; label: string }[] }>,
    )
  }, [study.tagFamilies])

  const { envPosts, envSubPosts } = useMemo(() => {
    const envSubPostsByPost = environmentSubPostsMapping[study.organizationVersion.environment]
    const posts = Object.keys(envSubPostsByPost) as Post[]
    const subPosts = posts.reduce((acc, post) => acc.concat(subPostsByPost[post] || []), [] as SubPost[])

    return {
      envPosts: posts,
      envSubPosts: Array.from(new Set(subPosts)),
    }
  }, [study.organizationVersion.environment])

  useEffect(() => {
    if (envSubPosts.length > 0) {
      const defaultPostItems = envSubPosts.map((sp) => sp as string)

      if (previousExportType !== exportType) {
        setPreviousExportType(exportType)
        hasInitializedRef.current = true
        if (defaultPostItems.length > 0) {
          onPostFilterChange(defaultPostItems)
        }
      } else if (!hasInitializedRef.current && selectedPostIds.length === 0 && defaultPostItems.length > 0) {
        hasInitializedRef.current = true
        onPostFilterChange(defaultPostItems)
      }
    }
  }, [envSubPosts, previousExportType, exportType, onPostFilterChange, selectedPostIds.length])

  const selectedSubPosts = useMemo(
    () => selectedPostIds.filter((id): id is SubPost => Object.values(SubPost).includes(id as SubPost)),
    [selectedPostIds],
  )

  useEffect(() => {
    if (tagItems && previousExportType !== exportType) {
      const defaultTagItems = Object.values(tagItems).flatMap((parent) => parent.children.map((child) => child.id))
      defaultTagItems.push('other')
      onTagFilterChange(defaultTagItems)
    }
  }, [tagItems, previousExportType, exportType, onTagFilterChange])

  return (
    <div className="flex gapped1">
      <PostSubPostFilter
        envPosts={envPosts}
        envSubPosts={envSubPosts}
        selectedSubPosts={selectedSubPosts}
        onChange={(subPosts) => onPostFilterChange(subPosts.map((sp) => String(sp)))}
      />
      <TagFilter tagFamilies={study.tagFamilies} selectedTagIds={selectedTagIds} onChange={onTagFilterChange} />
    </div>
  )
}

export default ResultFilters
