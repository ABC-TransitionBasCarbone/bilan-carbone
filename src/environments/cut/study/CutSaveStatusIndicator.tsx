'use client'

import SaveStatusIndicator from '@/components/publicodes-form/SaveStatusIndicator'
import { useCutPublicodes } from '../context/CutPublicodesProvider'

const CutSaveStatusIndicator = () => {
  const { autoSave, isLoading, error } = useCutPublicodes()

  if (isLoading || error) {
    return null
  }

  return (
    <SaveStatusIndicator
      status={{ status: autoSave.saveStatus, error: autoSave.error, lastSaved: autoSave.lastSaved }}
    />
  )
}

export default CutSaveStatusIndicator
