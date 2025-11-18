import { Menu, MenuProps, styled } from '@mui/material'

const DownloadMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'left',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'left',
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    backgroundColor: theme.palette.background.paper,
    padding: '1rem',
  },
  '& .MuiMenuItem-root': {
    textAlign: 'center',
    justifyContent: 'flex-end',
    padding: 0,
    cursor: 'default',
  },
  '& .MuiMenuItem-root:hover': {
    backgroundColor: theme.palette.background.paper,
  },
}))

export default DownloadMenu
