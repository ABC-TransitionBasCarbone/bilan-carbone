'use client'

import { FullStudyComments } from '@/db/study'
import { useServerFunction } from '@/hooks/useServerFunction'
import {
  approveStudyComment,
  createStudyCommentCommand,
  declineStudyComment,
  getStudyComments,
} from '@/services/serverFunctions/study'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import { Card, CardContent, TextField } from '@mui/material'
import { CommentStatus, SubPost } from '@prisma/client'
import { useCallback, useEffect, useState } from 'react'
import Button from '../base/Button'

interface Props {
  studyId: string
  subPost?: SubPost | null
  withField?: boolean
  canValidate?: boolean
}

const StudyCommentComponent = ({ studyId, subPost = null, withField = true, canValidate = false }: Props) => {
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
            <div key={comment.id}>
              <Card>
                <CardContent className="whitespace-pre-wrap">
                  <div className="flex justify-between">
                    {canValidate && <span className="font-medium">{comment.author.user.email}</span>}
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    {canValidate && <span>{comment.status}</span>}
                  </div>
                  <div>{comment.comment}</div>
                </CardContent>

                {canValidate && comment.status === 'PENDING' && (
                  <div className="flex justify-end gap-2">
                    <Button color="error" className="mr1" onClick={() => handleDecline(comment.id)}>
                      <DeleteIcon className="mr-2" />
                      Supprimer
                    </Button>
                    <Button color="success" onClick={() => handleApprove(comment.id)}>
                      <CheckIcon className="mr-2" />
                      Approuver
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          ))}
      </div>
    </div>
  )
}

export default StudyCommentComponent
