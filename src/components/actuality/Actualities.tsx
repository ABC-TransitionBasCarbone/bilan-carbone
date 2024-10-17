import { Actuality } from '@prisma/client'
import ActualityRow from './Actuality'

interface Props {
  actualities: Actuality[]
}

const Actualities = ({ actualities }: Props) => {
  const sortedActualities = actualities.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  return (
    <div className="grow">
      <h2>Mes actualités</h2>
      {actualities.length === 0 ? <>Aucunes actualités pour le moment</> : sortedActualities.map(ActualityRow)}
    </div>
  )
}

export default Actualities
