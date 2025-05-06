'use client'

import ActualitiesCards from '@/components/actuality/ActualitiesCards'
import { CUT } from '@/store/AppEnvironment'
import DynamicComponent from '../utils/DynamicComponent'

/**
 * NOTE: Composant à supprimer quand l'environment pourra être récupérer
 * depuis la session
 *
 * Remplacer par une condition if not CUT then <ActualitiesCards />
 */
const DynamicActualitiesCard = () => {
  return (
    <DynamicComponent
      defaultComponent={<ActualitiesCards />}
      environmentComponents={{
        [CUT]: <></>,
      }}
    />
  )
}

export default DynamicActualitiesCard
