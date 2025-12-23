'use client'
import { OrganizationVersionWithStudyComments } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  approveStudyComment,
  declineStudyComment,
  getPendingStudyCommentsFromOrganizationVersionId,
} from '@/services/serverFunctions/study'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import Block from '../base/Block'
import StudyCommentComponent from '../study/StudyComment'

interface Props {
  organizationVersionId: string
}

const CommentManagementPage = ({ organizationVersionId }: Props) => {
  const [comments, setComments] = useState<OrganizationVersionWithStudyComments | null>(null)
  const t = useTranslations('comments')
  const { callServerFunction } = useServerFunction()

  const fetchComments = useCallback(async () => {
    const res = await getPendingStudyCommentsFromOrganizationVersionId(organizationVersionId)
    if (res.success) {
      setComments(res.data)
    }
  }, [organizationVersionId])

  useEffect(() => {
    if (comments === null) {
      fetchComments()
    }
  }, [comments, fetchComments])

  const handleApprove = async (commentId: string, studyId: string) => {
    await callServerFunction(() => approveStudyComment(commentId, studyId), {
      onSuccess: () => {
        fetchComments()
      },
    })
  }

  const handleDecline = async (commentId: string, studyId: string) => {
    await callServerFunction(() => declineStudyComment(commentId, studyId), {
      onSuccess: () => {
        fetchComments()
      },
    })
  }

  const groupedByStudy = comments?.reduce(
    (acc, comment) => {
      const studyKey = comment.studyId
      if (!acc[studyKey]) {
        acc[studyKey] = { study: { id: comment.studyId, name: comment.study.name }, comments: [] }
      }
      acc[studyKey].comments.push(comment)
      return acc
    },
    {} as Record<string, { study: { name: string; id: string }; comments: OrganizationVersionWithStudyComments }>,
  )

  return (
    <Block title={t('title')} as="h1">
      {comments && !!comments.length ? (
        Object.values(groupedByStudy || {}).map(({ study, comments: studyComments }) => (
          <Block
            key={study.id}
            title={study.name}
            as="h2"
            actions={[{ actionType: 'link', href: `/etudes/${study.id}`, children: <OpenInNewIcon /> }]}
          >
            {studyComments.map((comment) => (
              <StudyCommentComponent
                key={comment.id}
                comment={comment}
                onApprove={(commentId) => handleApprove(commentId, comment.studyId)}
                onDecline={(commentId) => handleDecline(commentId, comment.studyId)}
                canValidate
              />
            ))}
          </Block>
        ))
      ) : comments ? (
        <p className="title-h3">{t('noComments')}</p>
      ) : null}
    </Block>
  )
}

export default CommentManagementPage
