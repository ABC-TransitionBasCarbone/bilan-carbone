'use server'

import { NOT_AUTHORIZED } from '@/services/permissions/check'
import { getUserSettings } from '@/services/serverFunctions/user'
import Settings from '../settings/Settings'
import NotFound from './NotFound'

const SettingsPage = async () => {
  const userSettings = await getUserSettings()
  if (!userSettings || userSettings === NOT_AUTHORIZED) {
    return <NotFound />
  }
  return <Settings userSettings={userSettings} />
}

export default SettingsPage
