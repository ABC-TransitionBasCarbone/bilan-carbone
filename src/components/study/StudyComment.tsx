'use client'

import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import { Card, CardContent, TextField } from '@mui/material'
import { CommentStatus } from '@prisma/client'
import { useMemo, useState } from 'react'
import Button from '../base/Button'

const fakeComments: StudyComment[] = [
  {
    id: '1',
    comment: 'Ceci est un commentaire en attente de validation.',
    status: 'PENDING',
    createdAt: '2024-06-01T10:00:00Z',
    author: { id: '1', name: 'name1' },
  },
  {
    id: '2',
    comment: 'Ceci est un commentaire approuvé.',
    status: 'VALIDATED',
    createdAt: '2024-06-02T11:30:00Z',
    author: { id: '2', name: 'name2' },
  },
]

interface StudyComment {
  id: string
  comment: string
  status: CommentStatus
  createdAt: string
  author: {
    id: string
    name: string
  }
}

interface Props {
  withField?: boolean
  comments?: StudyComment[]
  canValidate?: boolean
  onCreate?: (comment: string) => void
  onApprove?: (commentId: string) => void
  onDelete?: (commentId: string) => void
}

const StudyComment = ({
  withField = true,
  comments = fakeComments,
  canValidate = false,
  onCreate,
  onApprove,
  onDelete,
}: Props) => {
  const [newComment, setNewComment] = useState('')

  const filteredComments = useMemo(
    () => comments.filter((comment) => comment.status === CommentStatus.VALIDATED || canValidate),
    [comments, canValidate],
  )

  const handleSubmit = () => {
    if (!newComment.trim()) return
    onCreate?.(newComment)
    setNewComment('')
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
            />
          </CardContent>
          <div className="flex justify-end">
            <Button onClick={handleSubmit}>Envoyer</Button>
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

export default StudyComment
