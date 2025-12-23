'use client'

import { FullStudyComment } from '@/db/study'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import { Card, CardContent, TextField } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import Button from '../base/Button'

interface Props {
  canValidate?: boolean
  comment: FullStudyComment
  onApprove: (commentId: string) => Promise<void>
  onDecline: (commentId: string) => Promise<void>
  onEdit: (commentId: string, newComment: string) => Promise<void>
}

const StudyCommentComponent = ({ canValidate = false, comment, onApprove, onDecline, onEdit }: Props) => {
  const tCommon = useTranslations('common.action')
  const tComments = useTranslations('comments')
  const [isEditing, setIsEditing] = useState(false)
  const [editedComment, setEditedComment] = useState(comment.comment)

  const handleSaveEdit = async () => {
    await onEdit(comment.id, editedComment)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedComment(comment.comment)
    setIsEditing(false)
  }

  return (
    <div>
      <Card>
        <CardContent className="whitespace-pre-wrap">
          <div className="flex justify-between">
            {canValidate && <span className="font-medium">{comment.author.user.email}</span>}
            <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
            {canValidate && <span>{tComments(comment.status.toLowerCase())}</span>}
          </div>
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder={tComments('yourComment')}
              value={editedComment}
              onChange={(e) => setEditedComment(e.target.value)}
            />
          ) : (
            <div>{comment.comment}</div>
          )}
        </CardContent>

        {isEditing ? (
          <div className="flex justify-end gap-2 p-4">
            <Button onClick={handleCancel}>{tCommon('cancel')}</Button>
            <Button color="success" onClick={handleSaveEdit}>
              {tCommon('confirm')}
            </Button>
          </div>
        ) : (
          canValidate && (
            <div className="flex justify-end gap-2 p-4">
              <Button onClick={() => setIsEditing(true)}>
                <EditIcon className="mr-2" />
                {tCommon('edit')}
              </Button>
              <Button color="error" onClick={() => onDecline(comment.id)}>
                <DeleteIcon className="mr-2" />
                {tCommon('delete')}
              </Button>
              {comment.status === 'PENDING' && (
                <Button color="success" onClick={() => onApprove(comment.id)}>
                  <CheckIcon className="mr-2" />
                  {tCommon('approve')}
                </Button>
              )}
            </div>
          )
        )}
      </Card>
    </div>
  )
}

export default StudyCommentComponent
