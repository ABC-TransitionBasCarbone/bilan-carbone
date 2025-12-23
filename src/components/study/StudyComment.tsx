'use client'

import { FullStudyComment } from '@/db/study'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import { Card, CardContent } from '@mui/material'
import Button from '../base/Button'

interface Props {
  canValidate?: boolean
  comment: FullStudyComment
  onApprove: (commentId: string) => Promise<void>
  onDecline: (commentId: string) => Promise<void>
}

const StudyCommentComponent = ({ canValidate = false, comment, onApprove, onDecline }: Props) => {
  return (
    <div>
      <Card>
        <CardContent className="whitespace-pre-wrap">
          <div className="flex justify-between">
            {canValidate && <span className="font-medium">{comment.author.user.email}</span>}
            <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
            {canValidate && <span>{comment.status}</span>}
          </div>
          <div>{comment.comment}</div>
        </CardContent>

        {canValidate && comment.status === 'PENDING' && (
          <div className="flex justify-end gap-2">
            <Button color="error" className="mr1" onClick={() => onDecline(comment.id)}>
              <DeleteIcon className="mr-2" />
              Supprimer
            </Button>
            <Button color="success" onClick={() => onApprove(comment.id)}>
              <CheckIcon className="mr-2" />
              Approuver
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default StudyCommentComponent
