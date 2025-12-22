'use client'

import { useServerFunction } from '@/hooks/useServerFunction'
import { createStudyCommentCommand } from '@/services/serverFunctions/study'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import { Card, CardContent, TextField } from '@mui/material'
import { CommentStatus, StudyComment } from '@prisma/client'
import { useMemo, useState } from 'react'
import Button from '../base/Button'

const fakeComments: StudyComment[] = []

interface Props {
  studyId: string
  withField?: boolean
  comments?: StudyComment[]
  canValidate?: boolean
  onApprove?: (commentId: string) => void
  onDelete?: (commentId: string) => void
}

const StudyCommentComponent = ({
  studyId,
  withField = true,
  comments = fakeComments,
  canValidate = false,
  onApprove,
  onDelete,
}: Props) => {
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)

  const { callServerFunction } = useServerFunction()

  const filteredComments = useMemo(
    () => comments.filter((comment) => comment.status === CommentStatus.VALIDATED || canValidate),
    [comments, canValidate],
  )

  const handleSubmit = async () => {
    if (newComment) {
      setLoading(true)
      await callServerFunction(() => createStudyCommentCommand(studyId, newComment), {
        onSuccess: () => {
          setNewComment('')
        },
      })
      setLoading(false)
    }
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
        {filteredComments.map((comment) => (
          <div key={comment.id}>
            <Card>
              <CardContent className="whitespace-pre-wrap">
                <div className="flex justify-between">
                  <span className="font-medium">{comment.author.name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                  <span>{comment.status}</span>
                </div>
                <div>{comment.comment}</div>
              </CardContent>

              {canValidate && comment.status === 'PENDING' && (
                <div className="flex justify-end gap-2">
                  <Button color="error" className="mr1" onClick={() => onDelete?.(comment.id)}>
                    <DeleteIcon className="mr-2" />
                    Supprimer
                  </Button>
                  <Button color="success" onClick={() => onApprove?.(comment.id)}>
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
