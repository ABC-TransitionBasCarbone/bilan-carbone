import styles from './styles.module.css'

// import from https://mui.com/material-ui/material-icons
import HomeIcon from '@mui/icons-material/Home'
import LogoutIcon from '@mui/icons-material/Logout'
import PersonIcon from '@mui/icons-material/Person'

export const ICON_TYPE = {
  HOME: HomeIcon,
  LOGOUT: LogoutIcon,
  USER: PersonIcon,
}

export type IconType = (typeof ICON_TYPE)[keyof typeof ICON_TYPE]

const DEFAUT_SIZE = 24

interface Props {
  icon: IconType
  iconClassName?: string
  size?: number
  color?: string
}

const Icon = ({ icon: IconComponent, iconClassName, size = DEFAUT_SIZE, color = 'inherit' }: Props) => (
  <IconComponent className={`${styles.appIcon} ${iconClassName}`} style={{ fontSize: size, color }} />
)

export default Icon
