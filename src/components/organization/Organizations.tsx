'use client'

import { Organization } from '@prisma/client'
import classNames from 'classnames'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import Block from '../base/Block'
import Button from '../base/Button'
import OrganizationCard from './Organization'
import styles from './Organizations.module.css'

interface Props {
  organizations: Organization[]
}

const Organizations = ({ organizations }: Props) => {
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
  }, [organizations])

  return (
    <Block
      title={t('myOrganizations')}
      data-testid="home-organizations"
      actions={[
        {
          actionType: 'link',
          href: '/organisations/creer',
          ['data-testid']: 'new-organization',
          children: t('create'),
        },
      ]}
    >
      <ul
        id="organization-grid"
        ref={gridRef}
        className={classNames(styles.grid, 'mb1', { [styles.hideSubRows]: !showAll })}
      >
        {organizations.map((organization) => (
          <OrganizationCard key={organization.id} organization={organization} />
        ))}
      </ul>
      {hiddenRows && (
        <Button onClick={() => setShowAll(!showAll)} color="secondary">
          {t(showAll ? 'seeLess' : 'seeMore')}
        </Button>
      )}
    </Block>
  )
}

export default Organizations
