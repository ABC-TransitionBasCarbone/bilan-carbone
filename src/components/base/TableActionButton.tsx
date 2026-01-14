import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import { IconButton, IconButtonProps, Tooltip } from '@mui/material'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

interface Props extends Omit<IconButtonProps, 'type'> {
  type: 'edit' | 'duplicate' | 'delete'
  size?: 'small' | 'medium' | 'large'
}

export const TableActionButton = ({ type, size = 'medium', ...props }: Props) => {
  const t = useTranslations('common.action')

  const IconComponent = useMemo(() => {
    switch (type) {
      case 'edit':
        return EditOutlinedIcon
      case 'duplicate':
        return ContentCopyIcon
      case 'delete':
        return DeleteOutlinedIcon
      default:
        return null
    }
  }, [type])

  const tooltipTitle = useMemo(() => {
    switch (type) {
      case 'edit':
        return t('edit')
      case 'duplicate':
        return t('duplicate')
      case 'delete':
        return t('delete')
      default:
        return ''
    }
  }, [type, t])

  if (!IconComponent) {
    return null
  }

  return (
    <Tooltip title={tooltipTitle}>
      <IconButton size={size} color="primary" {...props}>
        <IconComponent color={type === 'delete' ? 'error' : 'primary'} fontSize={size} />
      </IconButton>
    </Tooltip>
  )
}
