'use server'

import { getUserSettings } from '@/services/serverFunctions/user'
import NotFound from '@abc-transitionbascarbone/application/components/pages/NotFound'
import Settings from '../settings/Settings'

const SettingsPage = async () => {
  const userSettings = await getUserSettings()
  if (!userSettings.success || !userSettings.data) {
    return <NotFound />
  }
  return <Settings userSettings={userSettings.data} />
}

export default SettingsPage
