'use server'

import { getUserSettings } from '@/services/serverFunctions/user'
import Settings from '../settings/Settings'
import NotFound from './NotFound'

const SettingsPage = async () => {
  const userSettings = await getUserSettings()
  if (!userSettings.success || !userSettings.data) {
    return <NotFound />
  }
  return <Settings userSettings={userSettings.data} />
}

export default SettingsPage
