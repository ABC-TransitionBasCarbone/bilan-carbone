import { Study } from '@prisma/client'
import { useTranslations } from 'next-intl'
import React from 'react'

interface Props {
  studies: Study[]
}

const Studies = ({ studies }: Props) => {
  const t = useTranslations('study')
  return (
    <>
      <h2>{t('my-studies')}</h2>
      <ul>
        {studies.map((study) => (
          <li key={study.id} data-testid={`studies-${study.name}`}>
            {study.name}
          </li>
        ))}
      </ul>
    </>
  )
}

export default Studies
