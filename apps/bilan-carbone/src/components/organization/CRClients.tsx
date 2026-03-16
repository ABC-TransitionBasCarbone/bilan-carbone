'use client'

import { OrganizationVersionWithOrganization } from '@/db/organization'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import Block from '../base/Block'
import Button from '../base/Button'
import ClientCard from './CRClient'
import styles from './CRClients.module.css'

interface Props {
  organizationVersions: OrganizationVersionWithOrganization[]
  canCreateOrga: boolean
}

const CRClients = ({ organizationVersions, canCreateOrga }: Props) => {
  const t = useTranslations('organization')
  const [showAll, setShowAll] = useState(false)
  const [hiddenRows, setHiddenRows] = useState(false)
  const gridRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const checkHiddenRows = () => {
      if (gridRef.current) {
        const hasHiddenRows = Array.from(gridRef.current.children).some((card) => card.clientHeight === 0)
        setHiddenRows(hasHiddenRows)
      }
    }

    checkHiddenRows()
    window.addEventListener('resize', checkHiddenRows)
    return () => window.removeEventListener('resize', checkHiddenRows)
  }, [organizationVersions])

  return (
    <Block
      title={t('myOrganizations')}
      data-testid="home-organizations"
      actions={
        canCreateOrga
          ? [
              {
                actionType: 'link',
                href: '/organisations/creer',
                ['data-testid']: 'new-organization',
                children: t('create'),
              },
            ]
          : []
      }
    >
      <ul
        id="organization-grid"
        ref={gridRef}
        className={classNames(styles.grid, 'mb1', { [styles.hideSubRows]: !showAll })}
      >
        {organizationVersions.map((organizationVersion) => (
          <ClientCard key={organizationVersion.id} organizationVersion={organizationVersion} />
        ))}
      </ul>
      {hiddenRows && <Button onClick={() => setShowAll(!showAll)}>{t(showAll ? 'seeLess' : 'seeMore')}</Button>}
    </Block>
  )
}

export default CRClients
