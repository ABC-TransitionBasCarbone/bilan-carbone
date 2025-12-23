'use client'

import { FullStudyComments } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  approveStudyComment,
  createStudyCommentCommand,
  declineStudyComment,
  editStudyComment,
  getStudyComments,
} from '@/services/serverFunctions/study'
import { Card, CardContent, TextField } from '@mui/material'
import { CommentStatus, SubPost } from '@prisma/client'
import { useCallback, useEffect, useState } from 'react'
import Button from '../base/Button'
import StudyCommentComponent from './StudyComment'

interface Props {
  studyId: string
  subPost?: SubPost | null
  withField?: boolean
  canValidate?: boolean
}

const StudyComments = ({ studyId, subPost = null, withField = true, canValidate = false }: Props) => {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState<FullStudyComments | null>(null)

  const { callServerFunction } = useServerFunction()

  const fetchComments = useCallback(async () => {
    const res = await getStudyComments(studyId, subPost)
    if (res.success) {
      const filteredComments = res.data.filter((comment) => comment.status === CommentStatus.VALIDATED || canValidate)
      setComments(filteredComments)
    }
  }, [canValidate, studyId, subPost])

  useEffect(() => {
    if (comments === null) {
      fetchComments()
    }
  }, [comments, fetchComments])

  const handleSubmit = async () => {
    if (newComment) {
      setLoading(true)
      await callServerFunction(() => createStudyCommentCommand(studyId, newComment, CommentStatus.PENDING, subPost), {
        onSuccess: () => {
          setNewComment('')
          fetchComments()
        },
      })
      setLoading(false)
    }
  }

  const handleApprove = async (commentId: string) => {
    if (!canValidate) {
      return
    }
    await callServerFunction(() => approveStudyComment(commentId, studyId), {
      onSuccess: () => {
        fetchComments()
      },
    })
  }

  const handleDecline = async (commentId: string) => {
    if (!canValidate) {
      return
    }
    await callServerFunction(() => declineStudyComment(commentId, studyId), {
      onSuccess: () => {
        fetchComments()
      },
    })
  }

  const handleEdit = async (commentId: string, newComment: string) => {
    if (!canValidate) {
      return
    }
    await callServerFunction(() => editStudyComment(commentId, newComment, studyId), {
      onSuccess: () => {
        fetchComments()
      },
    })
  }

  return (
    <div className="my1">
      {withField && (
        <Card className="rounded-2xl">
          <CardContent>
            <div className="text-lg font-semibold">Ajouter un commentaire</div>
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder="Votre commentaire…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={loading}
            />
          </CardContent>
          <div className="flex justify-end">
            <Button disabled={loading} onClick={handleSubmit}>
              Envoyer
            </Button>
          </div>
        </Card>
      )}

      <div className="my1">
        {comments &&
          comments.map((comment) => (
            <StudyCommentComponent
              key={comment.id}
              comment={comment}
              onApprove={handleApprove}
              onDecline={handleDecline}
              onEdit={handleEdit}
              canValidate={canValidate}
            />
          ))}
      </div>
    </div>
  )
}

export default StudyComments
