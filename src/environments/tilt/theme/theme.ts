import theme from '@/environments/base/theme/theme'
import { createTheme } from '@mui/material/styles'

const tiltTheme = createTheme(theme, {
  cssVariables: true,
})

export default tiltTheme
