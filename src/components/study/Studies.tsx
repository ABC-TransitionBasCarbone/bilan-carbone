import { Study } from '@prisma/client'
import Link from 'next/link'
import React from 'react'

interface Props {
  studies: Study[]
}

const Studies = ({ studies }: Props) => {
  return (
    <ul>
      {studies.map((study) => (
        <li key={study.id} data-testid={`studies-${study.name}`}>
          <Link href={`/etudes/${study.id}`}>{study.name}</Link>
        </li>
      ))}
    </ul>
  )
}

export default Studies
