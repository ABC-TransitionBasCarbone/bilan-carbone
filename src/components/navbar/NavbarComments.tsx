import { getPendingStudyCommentsCountFromOrganizationVersionId } from '@/services/serverFunctions/study'
import CommentIcon from '@mui/icons-material/Comment'
import { Badge } from '@mui/material'
import { useEffect, useState } from 'react'

interface Props {
  organizationVersionId: string | null
}

const NavbarComments = ({ organizationVersionId }: Props) => {
  const [displayCount, setDisplayCount] = useState<number | string>(0)

  useEffect(() => {
    const getCount = async () => {
      const response = await getPendingStudyCommentsCountFromOrganizationVersionId(organizationVersionId)
      const count = response.success ? response.data : 0

      const tmpDisplayCount = count > 9 ? '9+' : count
      setDisplayCount(tmpDisplayCount)
    }

    if (!organizationVersionId) {
      return
    }

    getCount()
  }, [organizationVersionId])

  if (!organizationVersionId) {
    return
  }

  return (
    <>
      <Badge badgeContent={displayCount} color="info" invisible={displayCount === 0} overlap="rectangular">
        <CommentIcon />
      </Badge>
    </>
  )
}

export default NavbarComments
