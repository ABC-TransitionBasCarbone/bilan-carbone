import { Actuality } from '@prisma/client'
import React from 'react'

interface Props {
  actualities: Actuality[]
}

const Actualities = ({ actualities }: Props) => {
  return (
    <div>
      <h2>Mes actualités</h2>
      {actualities.length === 0 ? (
        <>Aucunes actualités pour le moment</>
      ) : (
        actualities.map((actuality) => (
          <div key={actuality.id}>
            <h3>{actuality.title}</h3>
            <p>{actuality.text}</p>
          </div>
        ))
      )}
    </div>
  )
}

export default Actualities
