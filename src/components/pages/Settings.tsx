'use server'

import { getUserSettings } from '@/services/serverFunctions/userAuth'
import Settings from '../settings/Settings'
import NotFound from './NotFound'

const SettingsPage = async () => {
  const userSettings = await getUserSettings()
  if (!userSettings) {
    return <NotFound />
  }
  return <Settings userSettings={userSettings} />
}

export default SettingsPage
